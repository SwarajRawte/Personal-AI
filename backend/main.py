
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import models, schemas, crud, database
from sqlalchemy.exc import IntegrityError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleToken(BaseModel):
    token: str

GOOGLE_CLIENT_ID = "1076982736212-0fvtfej9mvdv5sanb818e4jsvh7h5cl0.apps.googleusercontent.com"

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import chat, tasks, notes, calendar_oauth, rag_admin, auth_utils, rag, models


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and warm up RAG collections
    logger.info("Starting Kortex Backend...")
    try:
        models.Base.metadata.create_all(bind=database.engine)
        # Process heavy RAG initialization in a background task or just call it here 
        # (since we are already in lifespan, it won't block the port binding check)
        rag.init_collections()
    except Exception as e:
        logger.error(f"Startup error: {e}")
    yield
    # Shutdown logic (if any)
    logger.info("Shutting down Kortex Backend...")

app = FastAPI(lifespan=lifespan)

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS configuration: Allow localhost for dev and your Vercel URL for production
origins = [
    "http://localhost:3000",
    "https://kortex-app.vercel.app", # Replace with your actual Vercel URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("RENDER") is None else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use dynamic secret key from environment or fallback to dev key
app.add_middleware(SessionMiddleware, secret_key=os.getenv("JWT_SECRET", "personal-ai-dev-secret-key-123"))

from database import SessionLocal
from dependencies import get_db, get_current_user

app.include_router(chat.router)
app.include_router(tasks.router)
app.include_router(notes.router)
app.include_router(calendar_oauth.router)
app.include_router(rag_admin.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "kortex-backend"}

@app.get("/")
def read_root():
    return {"message": "Welcome to Kortex backend!"}


@app.post("/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    try:
        new_user = crud.create_user(db, user)
        # Create secure JWT access token
        access_token = auth_utils.create_access_token(data={"sub": new_user.username})
        return {"access_token": access_token, "token_type": "bearer", "username": new_user.username}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already registered")

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    # Create secure JWT access token
    access_token = auth_utils.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

@app.post("/auth/google")
def auth_google(token_data: GoogleToken, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            token_data.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        user = crud.get_user_by_username(db, email)
        if not user:
            # Create user if not exists
            user_create = schemas.UserCreate(username=email, password=os.urandom(24).hex()) # Secure random password
            user = crud.create_user(db, user_create)
            
        # Create secure JWT access token
        access_token = auth_utils.create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer", "username": user.username}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
# rag_admin router registered above — reload trigger
