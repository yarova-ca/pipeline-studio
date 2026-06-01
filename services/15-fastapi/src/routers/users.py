"""Users router — CRUD for Items owned by the authenticated user.

All routes require a valid auth token via get_current_user dependency.

Routes:
  GET    /users/me/items        — list all items for current user
  POST   /users/me/items        — create a new item
  GET    /users/me/items/{id}   — get one item (404 if not found or not owned)
  PUT    /users/me/items/{id}   — update item title and/or description
  DELETE /users/me/items/{id}   — delete item, returns 204
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.db.models import Item
from src.db.session import get_db

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class ItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    user_id: int

    model_config = {"from_attributes": True}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_owned_item(item_id: int, user_id: int, db: AsyncSession) -> Item:
    """Fetch an item by id, asserting ownership.

    Raises HTTP 404 when the item does not exist or belongs to another user.
    """
    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.user_id == user_id)
    )
    item: Optional[Item] = result.scalars().first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/users/me/items", response_model=list[ItemResponse])
async def list_items(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Item]:
    """Return all items owned by the authenticated user."""
    result = await db.execute(
        select(Item).where(Item.user_id == current_user["id"])
    )
    return list(result.scalars().all())


@router.post("/users/me/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    body: ItemCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Item:
    """Create a new item for the authenticated user."""
    item = Item(
        title=body.title,
        description=body.description,
        user_id=current_user["id"],
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.get("/users/me/items/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Item:
    """Get a single item owned by the authenticated user."""
    return await _get_owned_item(item_id, current_user["id"], db)


@router.put("/users/me/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    body: ItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Item:
    """Update title and/or description of an item owned by the authenticated user."""
    item = await _get_owned_item(item_id, current_user["id"], db)
    if body.title is not None:
        item.title = body.title
    if body.description is not None:
        item.description = body.description
    await db.flush()
    await db.refresh(item)
    return item


@router.delete("/users/me/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an item owned by the authenticated user."""
    item = await _get_owned_item(item_id, current_user["id"], db)
    await db.delete(item)
    await db.flush()
