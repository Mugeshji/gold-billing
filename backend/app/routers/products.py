from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.crud import get_products, get_product, get_product_by_code, create_product, update_product, delete_product
from app.auth import get_current_user, get_current_admin
from app.models import User

router = APIRouter(prefix="/products", tags=["Products & Inventory"])

@router.get("/", response_model=List[ProductResponse])
def read_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_products(db, skip=skip, limit=limit, search=search, category=category)

@router.get("/{product_id}", response_model=ProductResponse)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = get_product(db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.get("/code/{code}", response_model=ProductResponse)
def read_product_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = get_product_by_code(db, code=code)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product code not found")
    return db_product

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_new_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = get_product_by_code(db, code=product.code)
    if db_product:
        raise HTTPException(status_code=400, detail="Product code already exists")
    return create_product(db=db, product=product)

@router.put("/{product_id}", response_model=ProductResponse)
def update_existing_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = update_product(db, product_id=product_id, product_update=product_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated

@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_existing_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    success = delete_product(db, product_id=product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}
