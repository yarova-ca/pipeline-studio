"""Users router — CRUD for Items owned by the authenticated user.

All routes require a valid auth token via get_current_user dependency.

Routes:
  GET    /users/me/items        — list items (paginated, max 100 per page)
  POST   /users/me/items        — create a new item
  GET    /users/me/items/{id}   — get one item (404 if not found or not owned)
  PUT    /users/me/items/{id}   — update item title and/or description
  DELETE /users/me/items/{id}   — delete item, returns 204
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.db.models import Item
from src.db.session import get_db

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ItemCreate(BaseModel):
    # Fix 5: Add Field max_length validation to prevent unbounded string inputs.
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)


class ItemUpdate(BaseModel):
    # Fix 5: Apply same length limits to update schema.
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)


class ItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    user_id: int

    model_config = {"from_attributes": True}


class PaginatedItemsResponse(BaseModel):
    items: list[ItemResponse]
    total: int
    limit: int
    offset: int


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

@router.get("/users/me/items", response_model=PaginatedItemsResponse)
async def list_items(
    # Fix 6: Paginated list — limit capped at 100, offset must be non-negative.
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return paginated items owned by the authenticated user."""
    user_id = current_user["id"]
    items_result = await db.execute(
        select(Item).where(Item.user_id == user_id).offset(offset).limit(limit)
    )
    total_result = await db.execute(
        select(func.count()).select_from(Item).where(Item.user_id == user_id)
    )
    return {
        "items": list(items_result.scalars().all()),
        "total": total_result.scalar_one(),
        "limit": limit,
        "offset": offset,
    }


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
