import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, UploadFile
from fastapi.responses import Response

from app.dependencies import get_current_user, get_db
from app.services.import_export import ImportExportService

router = APIRouter(prefix="/import-export", tags=["import_export"])


@router.get("/export")
async def export_csv(
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    category_id: uuid.UUID | None = None,
    type: str | None = None,
    currency: str | None = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    data = await ImportExportService(db).export_csv(
        current_user.id,
        from_=from_,
        to=to,
        category_id=category_id,
        type=type,
        currency=currency,
    )
    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.post("/import")
async def import_csv(
    file: UploadFile,
    dry_run: bool = True,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    content = await file.read()
    return await ImportExportService(db).import_csv(current_user.id, content, dry_run=dry_run)
