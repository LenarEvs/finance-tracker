import uuid
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession


class ImportExportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def export_csv(self, user_id: uuid.UUID, **filters) -> AsyncIterator[bytes]:
        raise NotImplementedError

    async def import_csv(self, user_id: uuid.UUID, content: bytes, dry_run: bool = True) -> dict:
        raise NotImplementedError
