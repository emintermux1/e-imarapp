from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.core.security import create_access_token, verify_password, get_password_hash
from app.models.user import User
from datetime import timedelta
from app.config import settings

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@router.post("/register")
async def register_user(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Check if user already exists
        result = await db.execute(f"SELECT * FROM users WHERE email = '{email}'")
        existing_user = result.fetchone()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Hash password
        hashed_password = get_password_hash(password)
        
        # Create new user
        new_user = User(
            email=email,
            hashed_password=hashed_password
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login_user(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Find user
        result = await db.execute(f"SELECT * FROM users WHERE email = '{email}'")
        user = result.fetchone()
        
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh")
async def refresh_token():
    try:
        # Implementation for refreshing access token
        # This would typically verify the refresh token and issue a new access token
        return {"message": "Token refreshed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))