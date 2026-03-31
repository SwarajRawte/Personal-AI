
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

class GoogleToken(BaseModel):
    token: str

GOOGLE_CLIENT_ID = "1076982736212-0fvtfej9mvdv5sanb818e4jsvh7h5cl0.apps.googleusercontent.com"


from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import chat, tasks, notes, calendar_oauth, rag_admin

models.Base.metadata.create_all(bind=database.engine)


app = FastAPI()

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Added for OAuth state management
app.add_middleware(SessionMiddleware, secret_key="personal-ai-secret-key-123")

from database import SessionLocal
from dependencies import get_db, get_current_user

app.include_router(chat.router)
app.include_router(tasks.router)
app.include_router(notes.router)
app.include_router(calendar_oauth.router)
app.include_router(rag_admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PersonalAI backend!"}

@app.post("/signup", response_model=schemas.UserOut)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    try:
        return crud.create_user(db, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already registered")

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    # For demo: return username as token (replace with JWT in production)
    return {"access_token": user.username, "token_type": "bearer"}

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
            user_create = schemas.UserCreate(username=email, password="google_oauth_placeholder_password")
            # We don't have full_name in schemas.UserCreate yet, so we just pass what schema supports.
            user = crud.create_user(db, user_create)
            
        return {"access_token": user.username, "token_type": "bearer"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
# rag_admin router registered above — reload trigger
