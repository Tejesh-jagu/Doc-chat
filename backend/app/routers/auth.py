import secrets
import base64
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserRegister, UserLogin, GoogleAuthRequest, UserResponse, TokenResponse, PasswordChange
from ..auth import hash_password, verify_password, create_access_token, get_current_user, require_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    email = payload.email
    name = payload.name

    # If a Google JWT ID credential was passed, decode its payload safely
    if payload.credential and not email:
        try:
            parts = payload.credential.split(".")
            if len(parts) >= 2:
                padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                decoded_bytes = base64.urlsafe_b64decode(padded)
                data = json.loads(decoded_bytes.decode("utf-8"))
                email = data.get("email")
                name = data.get("name") or data.get("given_name")
        except Exception:
            pass

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is required"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        display_name = name or email.split("@")[0].capitalize()
        random_pw = secrets.token_urlsafe(32)
        user = User(
            email=email,
            name=display_name,
            hashed_password=hash_password(random_pw),
            background_theme="mountains",
            preferred_model="qwen2.5:3b"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif name and (not user.name or user.name == "Demo User"):
        user.name = name
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hash_password(user_data.password),
        background_theme="mountains",
        preferred_model="qwen2.5:3b"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(require_current_user)):
    return current_user

@router.post("/password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match"
        )
    
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

