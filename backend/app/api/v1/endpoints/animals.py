from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.animal import Animal, AnimalSpecies
from app.models.farmer import Farmer
from app.models.user import User, UserRole
from app.schemas.animal import AnimalCreate, AnimalList, AnimalResponse
from app.services.geospatial import geopoint_to_wkt

router = APIRouter()

_SPECIES_ALIASES = {
    "horse": "equine",
    "camel": "equine",
    "donkey": "equine",
    "mule": "equine",
}


def _normalize_species(species: str) -> str:
    normalized = _SPECIES_ALIASES.get(species, species)
    if normalized not in AnimalSpecies.__members__:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported species: {species}",
        )
    return normalized


async def _owner_id_for(db: AsyncSession, user: User) -> int | None:
    """For farmers, resolve their Farmer profile id; everyone else is unscoped."""
    if user.role == UserRole.farmer:
        result = await db.execute(select(Farmer).where(Farmer.user_id == user.id))
        profile = result.scalar_one_or_none()
        return profile.id if profile else None
    return None


async def _assert_owner(db: AsyncSession, user: User, animal: Animal) -> None:
    owner_id = await _owner_id_for(db, user)
    if owner_id is not None and animal.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your animal")


@router.post("", response_model=AnimalResponse, status_code=status.HTTP_201_CREATED)
async def create_animal(
    animal_data: AnimalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnimalResponse:
    existing = await db.execute(select(Animal).where(Animal.tag_number == animal_data.tag_number))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tag number already exists")

    owner_id = animal_data.owner_id
    if owner_id is None:
        if current_user.role == UserRole.farmer:
            result = await db.execute(select(Farmer).where(Farmer.user_id == current_user.id))
            profile = result.scalar_one_or_none()
            if not profile:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Farmer profile not found; please contact support",
                )
            owner_id = profile.id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="owner_id is required for this role",
            )

    farmer_result = await db.execute(select(Farmer).where(Farmer.id == owner_id))
    if not farmer_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Farmer not found")

    animal = Animal(
        tag_number=animal_data.tag_number,
        name=animal_data.name,
        species=_normalize_species(animal_data.species),
        breed=animal_data.breed,
        gender=animal_data.gender,
        date_of_birth=animal_data.date_of_birth,
        color=animal_data.color,
        owner_id=owner_id,
        location=geopoint_to_wkt(animal_data.location),
    )
    db.add(animal)
    await db.flush()

    farmer_result = await db.execute(select(Farmer).where(Farmer.id == owner_id))
    farmer = farmer_result.scalar_one_or_none()
    if farmer:
        farmer.livestock_count += 1

    await db.commit()
    await db.refresh(animal)
    return AnimalResponse.model_validate(animal)


@router.get("", response_model=AnimalList)
async def list_animals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    species: str | None = None,
    owner_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnimalList:
    query = select(Animal).where(Animal.is_active.is_(True))
    if species:
        query = query.where(Animal.species == species)
    scoped_owner = await _owner_id_for(db, current_user)
    if scoped_owner is not None:
        query = query.where(Animal.owner_id == scoped_owner)
    elif owner_id:
        query = query.where(Animal.owner_id == owner_id)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    animals = list(result.scalars().all())

    total_result = await db.execute(
        select(func.count(Animal.id)).where(Animal.is_active.is_(True))
    )
    total = total_result.scalar() or 0

    return AnimalList(
        total=total,
        items=[AnimalResponse.model_validate(a) for a in animals],
    )


@router.get("/by-owner/{owner_id}", response_model=AnimalList)
async def get_animals_by_owner(
    owner_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnimalList:
    scoped_owner = await _owner_id_for(db, current_user)
    if scoped_owner is not None:
        owner_id = scoped_owner
    result = await db.execute(select(Animal).where(Animal.owner_id == owner_id, Animal.is_active.is_(True)))
    animals = list(result.scalars().all())
    return AnimalList(total=len(animals), items=[AnimalResponse.model_validate(a) for a in animals])


@router.get("/{animal_id}", response_model=AnimalResponse)
async def get_animal(
    animal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnimalResponse:
    result = await db.execute(select(Animal).where(Animal.id == animal_id))
    animal = result.scalar_one_or_none()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")
    await _assert_owner(db, current_user, animal)
    return AnimalResponse.model_validate(animal)


@router.put("/{animal_id}", response_model=AnimalResponse)
async def update_animal(
    animal_id: int,
    animal_data: AnimalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnimalResponse:
    result = await db.execute(select(Animal).where(Animal.id == animal_id))
    animal = result.scalar_one_or_none()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")
    await _assert_owner(db, current_user, animal)

    for field, value in animal_data.model_dump(exclude_unset=True).items():
        setattr(animal, field, geopoint_to_wkt(value) if field == "location" else value)

    await db.commit()
    await db.refresh(animal)
    return AnimalResponse.model_validate(animal)


@router.delete("/{animal_id}", response_model=dict)
async def delete_animal(
    animal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    result = await db.execute(select(Animal).where(Animal.id == animal_id))
    animal = result.scalar_one_or_none()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")
    await _assert_owner(db, current_user, animal)

    animal.is_active = False

    farmer_result = await db.execute(select(Farmer).where(Farmer.id == animal.owner_id))
    farmer = farmer_result.scalar_one_or_none()
    if farmer and farmer.livestock_count > 0:
        farmer.livestock_count -= 1

    await db.commit()
    return {"message": "Animal deactivated"}
