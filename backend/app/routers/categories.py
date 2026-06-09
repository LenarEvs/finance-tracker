import uuid

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_db
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    type: str | None = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await CategoryService(db).list(current_user.id, type=type)


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    body: CategoryCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await CategoryService(db).create(current_user.id, body)


@router.get("/{id}", response_model=CategoryResponse)
async def get_category(
    id: uuid.UUID,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await CategoryService(db).get(current_user.id, id)


@router.patch("/{id}", response_model=CategoryResponse)
async def update_category(
    id: uuid.UUID,
    body: CategoryUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await CategoryService(db).update(current_user.id, id, body)


@router.delete("/{id}", status_code=204)
async def archive_category(
    id: uuid.UUID,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    await CategoryService(db).archive(current_user.id, id)
