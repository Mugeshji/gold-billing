from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerDetailResponse
from app.crud import get_customers, get_customer, get_customer_by_phone, create_customer, update_customer
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=List[CustomerResponse])
def read_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_customers(db, skip=skip, limit=limit, search=search)

@router.get("/{customer_id}", response_model=CustomerDetailResponse)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_customer = get_customer(db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@router.get("/phone/{phone}", response_model=CustomerResponse)
def read_customer_by_phone(
    phone: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_customer = get_customer_by_phone(db, phone=phone)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found with this phone number")
    return db_customer

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_new_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_customer = get_customer_by_phone(db, phone=customer.phone)
    if db_customer:
        raise HTTPException(status_code=400, detail="Customer with this phone number already exists")
    return create_customer(db=db, customer=customer)

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_existing_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = update_customer(db, customer_id=customer_id, customer_update=customer_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated
