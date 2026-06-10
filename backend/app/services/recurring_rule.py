from __future__ import annotations

import uuid
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recurring_rule import RecurringRule
from app.schemas.recurring_rule import RecurringRuleCreate, RecurringRuleUpdate


def _next_run(day: int) -> date:
    """Return the next occurrence of given day_of_month from today."""
    today = date.today()
    candidate = today.replace(day=min(day, _days_in_month(today.year, today.month)))
    if candidate <= today:
        # advance to next month
        year, month = today.year, today.month + 1
        if month > 12:
            month = 1
            year += 1
        candidate = date(year, month, min(day, _days_in_month(year, month)))
    return candidate


def _days_in_month(year: int, month: int) -> int:
    from calendar import monthrange
    return monthrange(year, month)[1]


class RecurringRuleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, user_id: uuid.UUID) -> list[RecurringRule]:
        result = await self.db.execute(
            select(RecurringRule).where(RecurringRule.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get(self, user_id: uuid.UUID, rule_id: uuid.UUID) -> RecurringRule:
        result = await self.db.execute(
            select(RecurringRule).where(RecurringRule.id == rule_id, RecurringRule.user_id == user_id)
        )
        rule = result.scalar_one_or_none()
        if not rule:
            raise HTTPException(status_code=404, detail="Recurring rule not found")
        return rule

    async def create(self, user_id: uuid.UUID, body: RecurringRuleCreate) -> RecurringRule:
        data = body.model_dump()
        data["next_run_date"] = _next_run(data["day_of_month"])
        rule = RecurringRule(user_id=user_id, **data)
        self.db.add(rule)
        await self.db.commit()
        await self.db.refresh(rule)
        return rule

    async def update(self, user_id: uuid.UUID, rule_id: uuid.UUID, body: RecurringRuleUpdate) -> RecurringRule:
        rule = await self.get(user_id, rule_id)
        updates = body.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(rule, field, value)
        if "day_of_month" in updates:
            rule.next_run_date = _next_run(rule.day_of_month)
        await self.db.commit()
        await self.db.refresh(rule)
        return rule

    async def delete(self, user_id: uuid.UUID, rule_id: uuid.UUID) -> None:
        rule = await self.get(user_id, rule_id)
        await self.db.delete(rule)
        await self.db.commit()
