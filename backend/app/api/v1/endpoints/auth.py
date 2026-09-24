import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
    get_current_user,
)
from app.models.user import User, UserRole
from app.schemas.user import (
    GoogleLoginRequest,
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
)
from app.services.google_auth import verify_google_id_token

router = APIRouter()

GOOGLE_SELF_SERVICE_ROLES = {
    UserRole.farmer,
    UserRole.veterinarian,
    UserRole.govt_officer,
}


async def _assign_profile(user: User, db: AsyncSession) -> None:
    """Create the role-specific profile row (farmer / veterinarian)."""
    if user.role == UserRole.farmer:
        from app.models.farmer import Farmer
        db.add(Farmer(user_id=user.id, name=user.full_name, phone=user.phone))
    elif user.role == UserRole.veterinarian:
        from app.models.veterinarian import Veterinarian
        db.add(Veterinarian(user_id=user.id, name=user.full_name, phone=user.phone))


async def _unique_google_phone(db: AsyncSession) -> str:
    while True:
        candidate = "9" + "".join(secrets.choice("0123456789") for _ in range(9))
        existing = await db.execute(select(User).where(User.phone == candidate))
        if not existing.scalar_one_or_none():
            return candidate


@router.post("/google", response_model=TokenResponse)
async def google_login(
    login_data: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    claims = await verify_google_id_token(login_data.credential)
    email = claims["email"].lower()

    user = (
        await db.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()

    if user is None:
        try:
            role = UserRole(login_data.role)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

        if role not in GOOGLE_SELF_SERVICE_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be farmer, veterinarian or govt_officer",
            )

        user = User(
            email=email,
            phone=await _unique_google_phone(db),
            full_name=claims.get("name") or email.split("@")[0],
            hashed_password=hash_password(secrets.token_urlsafe(24)),
            role=role,
            language_preference="en",
        )
        db.add(user)
        await db.flush()
        await _assign_profile(user, db)

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=token,
        expires_in=30,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    existing = await db.execute(
        select(User).where(or_(User.phone == user_data.phone, User.email == user_data.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    try:
        role = UserRole(user_data.role)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    if role not in (UserRole.farmer, UserRole.veterinarian):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self-registration is only allowed for farmers and veterinarians",
        )

    user = User(
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=role,
        language_preference=user_data.language_preference,
    )
    db.add(user)
    await db.flush()

    from app.models.farmer import Farmer
    if role == UserRole.farmer:
        farmer = Farmer(user_id=user.id, name=user.full_name, phone=user.phone)
        db.add(farmer)

    if role == UserRole.veterinarian:
        from app.models.veterinarian import Veterinarian
        vet = Veterinarian(user_id=user.id, name=user.full_name, phone=user.phone)
        db.add(vet)

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=token,
        expires_in=30,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(
        select(User).where(
            or_(User.email == login_data.identifier, User.phone == login_data.identifier)
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=token,
        expires_in=30,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    if "full_name" in update_data:
        current_user.full_name = update_data["full_name"]
    if "language_preference" in update_data:
        current_user.language_preference = update_data["language_preference"]

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)
