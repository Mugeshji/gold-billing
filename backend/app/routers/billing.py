from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import InvoiceCreate, InvoiceResponse, InvoiceDetailResponse
from app.crud import get_invoices, get_invoice, create_invoice, get_invoice_by_number
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/billing", tags=["Billing & Invoices"])

@router.get("/", response_model=List[InvoiceResponse])
def read_invoices(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_invoices(db, skip=skip, limit=limit, customer_id=customer_id)

@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
def read_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_invoice = get_invoice(db, invoice_id=invoice_id)
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return db_invoice

@router.get("/number/{invoice_number}", response_model=InvoiceDetailResponse)
def read_invoice_by_number(
    invoice_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_invoice = get_invoice_by_number(db, invoice_number=invoice_number)
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice number not found")
    return db_invoice

@router.post("/", response_model=InvoiceDetailResponse, status_code=status.HTTP_201_CREATED)
def generate_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        db_invoice = create_invoice(db=db, invoice_in=invoice_in, user_id=current_user.id)
        return db_invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")
