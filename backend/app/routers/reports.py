from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.schemas import DashboardStatsResponse
from app.crud import get_dashboard_stats, get_sales_report
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
def read_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_stats(db)

@router.get("/sales")
def read_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        parsed_start = datetime.fromisoformat(start_date) if start_date else None
        parsed_end = datetime.fromisoformat(end_date) if end_date else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format YYYY-MM-DD")
        
    return get_sales_report(db, start_date=parsed_start, end_date=parsed_end)
