from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.auth.dependencies import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    name = data.name.strip()
    email = data.email.lower().strip()

    if len(name) < 3:
        raise HTTPException(
            status_code=400,
            detail="Name must contain at least 3 characters.",
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters.",
        )

    existing_user = db.execute(
        text("""
            SELECT id
            FROM users
            WHERE LOWER(email) = LOWER(:email)
            LIMIT 1
        """),
        {
            "email": data.email,
        },
    ).fetchone()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )


    result = db.execute(
        text("""
            INSERT INTO users (
                name,
                email,
                password_hash
            )
            VALUES (
                :name,
                :email,
                :password_hash
            )
            RETURNING id, name, email, created_at
        """),
        {
            "name": data.name,
            "email": data.email,
            "password_hash": hash_password(data.password),
        },
    )


    user = dict(result.fetchone()._mapping)

    db.commit()

    token = create_access_token(
        str(user["id"])
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    result = db.execute(
        text("""
            SELECT
                id,
                name,
                email,
                password_hash,
                is_active
            FROM users
            WHERE LOWER(email) = LOWER(:email)
            LIMIT 1
        """),
        {"email": data.email},
    )

    user = result.fetchone()

    if user is None or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    token = create_access_token(
        str(user.id)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
        },
    }


@router.get("/me")
def get_me(
    current_user=Depends(get_current_user),
):
    return current_user