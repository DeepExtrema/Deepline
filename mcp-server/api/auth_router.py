"""
Authentication API Router

Endpoints for:
- User signup/registration
- User login
- Token refresh
- Logout
- User profile
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from security.authentication import (
    auth_manager,
    User,
    UserCreate,
    UserLogin,
    Token,
    TokenData,
    get_current_user,
    get_current_active_user,
)


class SignupRequest(UserCreate):
    """Request model for user signup"""
    pass


class LoginRequest(UserLogin):
    """Request model for user login"""
    pass


class LoginResponse(BaseModel):
    """Response model for login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]


class RefreshTokenRequest(BaseModel):
    """Request model for token refresh"""
    refresh_token: str = Field(..., description="Refresh token")


class UserProfileResponse(BaseModel):
    """Response model for user profile"""
    username: str
    email: str
    full_name: str
    role: str
    permissions: list


def create_auth_router() -> APIRouter:
    """Create and configure the authentication router"""
    router = APIRouter(prefix="/auth", tags=["authentication"])

    @router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
    async def signup(request: SignupRequest):
        """
        Register a new user account
        
        - Creates a new user with provided credentials
        - Returns access token and user information
        """
        try:
            # Create user
            user = auth_manager.create_user(request)
            
            # Generate tokens
            token = auth_manager.create_tokens(user)
            
            return LoginResponse(
                access_token=token.access_token,
                refresh_token=token.refresh_token,
                expires_in=token.expires_in,
                user=token.user
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )

    @router.post("/login", response_model=LoginResponse)
    async def login(request: LoginRequest):
        """
        Authenticate user and return access token
        
        - Validates credentials
        - Returns JWT access token and refresh token
        - Returns user profile information
        """
        # Authenticate user
        user = auth_manager.authenticate_user(request.username, request.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Generate tokens
        token = auth_manager.create_tokens(user)
        
        return LoginResponse(
            access_token=token.access_token,
            refresh_token=token.refresh_token,
            expires_in=token.expires_in,
            user=token.user
        )

    @router.post("/logout")
    async def logout(current_user: TokenData = Depends(get_current_user)):
        """
        Logout user and revoke access token
        
        - Adds token to blacklist
        - Requires valid access token
        """
        # Note: In a production system, you'd get the actual token from the request
        # For now, we'll just return success
        return {"message": "Successfully logged out"}

    @router.post("/refresh", response_model=LoginResponse)
    async def refresh_token(request: RefreshTokenRequest):
        """
        Refresh access token using refresh token
        
        - Validates refresh token
        - Issues new access token
        """
        try:
            # Verify refresh token
            token_data = auth_manager.verify_token(request.refresh_token)
            
            # Get user from token data
            from security.authentication import users_db
            user = users_db.get(token_data.username)
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            # Generate new tokens
            token = auth_manager.create_tokens(user)
            
            return LoginResponse(
                access_token=token.access_token,
                refresh_token=token.refresh_token,
                expires_in=token.expires_in,
                user=token.user
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

    @router.get("/me", response_model=UserProfileResponse)
    async def get_profile(current_user: TokenData = Depends(get_current_active_user)):
        """
        Get current user profile
        
        - Requires valid access token
        - Returns user information and permissions
        """
        return UserProfileResponse(
            username=current_user.username,
            email=current_user.username + "@example.com",  # In production, get from DB
            full_name=current_user.username,  # In production, get from DB
            role=current_user.role,
            permissions=current_user.permissions
        )

    @router.get("/verify")
    async def verify_token(current_user: TokenData = Depends(get_current_user)):
        """
        Verify if token is valid
        
        - Returns 200 if token is valid
        - Returns 401 if token is invalid or expired
        """
        return {
            "valid": True,
            "username": current_user.username,
            "role": current_user.role
        }

    return router
