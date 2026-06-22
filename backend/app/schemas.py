from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# ==========================================
# Authentication Schemas
# ==========================================
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# ==========================================
# User Schemas
# ==========================================
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: str = "Staff"  # Admin, Staff

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Product Schemas (Inventory)
# ==========================================
class ProductBase(BaseModel):
    code: str = Field(..., description="Unique Barcode/SKU code")
    name: str
    category: str  # Gold, Silver, Diamond, Other
    purity: str  # 22K, 18K, 24K, 925, etc.
    weight: float = Field(..., description="Weight in grams")
    count: int = Field(0, description="Quantity in stock")
    price_per_gram: float = Field(0.0, description="Metal price per gram")
    making_charge_per_gram: float = 0.0
    wastage_percentage: float = 0.0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    purity: Optional[str] = None
    weight: Optional[float] = None
    count: Optional[int] = None
    price_per_gram: Optional[float] = None
    making_charge_per_gram: Optional[float] = None
    wastage_percentage: Optional[float] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Customer Schemas
# ==========================================
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Payment Schemas
# ==========================================
class PaymentBase(BaseModel):
    amount: float
    payment_mode: str  # Cash, Card, UPI, Bank Transfer
    reference_number: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    invoice_id: int
    payment_date: datetime

    class Config:
        from_attributes = True


# ==========================================
# Invoice Item Schemas
# ==========================================
class InvoiceItemBase(BaseModel):
    product_id: Optional[int] = None
    item_name: str
    category: str
    weight: float
    purity: str
    metal_rate: float
    making_charge: float
    wastage_percent: float
    gst_rate: float = 3.0
    amount: float

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemResponse(InvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True


# ==========================================
# Invoice Schemas
# ==========================================
class InvoiceBase(BaseModel):
    customer_id: int
    subtotal: float
    making_charges_total: float
    gst_amount: float
    discount: float = 0.0
    total_amount: float
    payment_status: str  # Paid, Partial, Unpaid
    payment_mode: str  # Cash, Card, UPI, Bank Transfer
    branch: str = "Main Branch"

class InvoiceCreate(BaseModel):
    customer_id: Optional[int] = None
    # Support inline customer creation during invoice generation
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    
    subtotal: float
    making_charges_total: float
    gst_amount: float
    discount: float = 0.0
    total_amount: float
    payment_status: str
    payment_mode: str
    branch: str = "Main Branch"
    
    items: List[InvoiceItemCreate]
    payment_reference: Optional[str] = None

class InvoiceResponse(InvoiceBase):
    id: int
    invoice_number: str
    user_id: int
    invoice_date: datetime

    class Config:
        from_attributes = True

class InvoiceDetailResponse(InvoiceResponse):
    customer: CustomerResponse
    user: UserResponse
    items: List[InvoiceItemResponse]
    payments: List[PaymentResponse]

    class Config:
        from_attributes = True


# ==========================================
# Customer Detail Response (With History)
# ==========================================
class CustomerDetailResponse(CustomerResponse):
    invoices: List[InvoiceResponse] = []

    class Config:
        from_attributes = True


# ==========================================
# Dashboard & Analytics Schemas
# ==========================================
class DashboardStatsResponse(BaseModel):
    today_sales: float
    today_orders: int
    active_customers: int
    low_stock_count: int
    recent_invoices: List[InvoiceResponse]
    low_stock_products: List[ProductResponse]
