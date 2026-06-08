import uuid

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(type: str | None = None, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(body: CategoryCreate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/{id}", response_model=CategoryResponse)
async def get_category(id: uuid.UUID, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.patch("/{id}", response_model=CategoryResponse)
async def update_category(id: uuid.UUID, body: CategoryUpdate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.delete("/{id}", status_code=204)
async def archive_category(id: uuid.UUID, current_user=Depends(get_current_user)):
    raise NotImplementedError
