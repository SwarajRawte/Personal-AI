from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from requests_oauthlib import OAuth2Session
import os

router = APIRouter()

# Google OAuth2 config (replace with your credentials)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "your-google-client-id")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "your-google-client-secret")
GOOGLE_AUTH_URI = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/calendar/google/callback")
GOOGLE_SCOPE = ["https://www.googleapis.com/auth/calendar.readonly"]

@router.get("/calendar/google/login")
def google_calendar_login(request: Request):
    oauth = OAuth2Session(GOOGLE_CLIENT_ID, redirect_uri=GOOGLE_REDIRECT_URI, scope=GOOGLE_SCOPE)
    authorization_url, state = oauth.authorization_url(GOOGLE_AUTH_URI, access_type="offline", prompt="consent")
    request.session = {}  # Placeholder for session storage
    request.session['oauth_state'] = state
    return RedirectResponse(authorization_url)

@router.get("/calendar/google/callback")
def google_calendar_callback(request: Request, code: str = None, state: str = None):
    oauth = OAuth2Session(GOOGLE_CLIENT_ID, redirect_uri=GOOGLE_REDIRECT_URI, state=state)
    token = oauth.fetch_token(GOOGLE_TOKEN_URI, client_secret=GOOGLE_CLIENT_SECRET, code=code)
    # Save token in user session or database for future use
    return {"token": token}

# Outlook OAuth2 config (replace with your credentials)
OUTLOOK_CLIENT_ID = os.getenv("OUTLOOK_CLIENT_ID", "your-outlook-client-id")
OUTLOOK_CLIENT_SECRET = os.getenv("OUTLOOK_CLIENT_SECRET", "your-outlook-client-secret")
OUTLOOK_AUTH_URI = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
OUTLOOK_TOKEN_URI = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
OUTLOOK_REDIRECT_URI = os.getenv("OUTLOOK_REDIRECT_URI", "http://localhost:8000/calendar/outlook/callback")
OUTLOOK_SCOPE = ["https://outlook.office.com/calendars.read"]

@router.get("/calendar/outlook/login")
def outlook_calendar_login(request: Request):
    oauth = OAuth2Session(OUTLOOK_CLIENT_ID, redirect_uri=OUTLOOK_REDIRECT_URI, scope=OUTLOOK_SCOPE)
    authorization_url, state = oauth.authorization_url(OUTLOOK_AUTH_URI, response_type="code")
    request.session = {}  # Placeholder for session storage
    request.session['oauth_state'] = state
    return RedirectResponse(authorization_url)

@router.get("/calendar/outlook/callback")
def outlook_calendar_callback(request: Request, code: str = None, state: str = None):
    oauth = OAuth2Session(OUTLOOK_CLIENT_ID, redirect_uri=OUTLOOK_REDIRECT_URI, state=state)
    token = oauth.fetch_token(OUTLOOK_TOKEN_URI, client_secret=OUTLOOK_CLIENT_SECRET, code=code)
    # Save token in user session or database for future use
    return {"token": token}
