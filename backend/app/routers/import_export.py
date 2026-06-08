from fastapi import APIRouter, Depends, UploadFile

from app.dependencies import get_current_user

router = APIRouter(prefix="/import-export", tags=["import_export"])


@router.get("/export")
async def export_csv(current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.post("/import")
async def import_csv(file: UploadFile, dry_run: bool = True, current_user=Depends(get_current_user)):
    raise NotImplementedError
