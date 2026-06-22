from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import random
from typing import List, Optional

from app.models import User, Product, Customer, Invoice, InvoiceItem, Payment
from app.schemas import UserCreate, ProductCreate, ProductUpdate, CustomerCreate, CustomerUpdate, InvoiceCreate, PaymentCreate
from app.auth import get_password_hash

# ==========================================
# User CRUD
# ==========================================
def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_pwd = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        password_hash=hashed_pwd,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ==========================================
# Product CRUD (Inventory)
# ==========================================
def get_product(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()

def get_product_by_code(db: Session, code: str) -> Optional[Product]:
    return db.query(Product).filter(Product.code == code).first()

def get_products(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None, category: Optional[str] = None) -> List[Product]:
    query = db.query(Product)
    if search:
        query = query.filter((Product.name.like(f"%{search}%")) | (Product.code.like(f"%{search}%")))
    if category:
        query = query.filter(Product.category == category)
    return query.offset(skip).limit(limit).all()

def create_product(db: Session, product: ProductCreate) -> Product:
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: ProductUpdate) -> Optional[Product]:
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True


# ==========================================
# Customer CRUD
# ==========================================
def get_customer(db: Session, customer_id: int) -> Optional[Customer]:
    return db.query(Customer).filter(Customer.id == customer_id).first()

def get_customer_by_phone(db: Session, phone: str) -> Optional[Customer]:
    return db.query(Customer).filter(Customer.phone == phone).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> List[Customer]:
    query = db.query(Customer)
    if search:
        query = query.filter((Customer.name.like(f"%{search}%")) | (Customer.phone.like(f"%{search}%")))
    return query.offset(skip).limit(limit).all()

def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def update_customer(db: Session, customer_id: int, customer_update: CustomerUpdate) -> Optional[Customer]:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    for key, value in customer_update.dict(exclude_unset=True).items():
        setattr(db_customer, key, value)
    db.commit()
    db.refresh(db_customer)
    return db_customer


# ==========================================
# Billing & Invoice CRUD (Transactional)
# ==========================================
def get_invoice(db: Session, invoice_id: int) -> Optional[Invoice]:
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()

def get_invoice_by_number(db: Session, invoice_number: str) -> Optional[Invoice]:
    return db.query(Invoice).filter(Invoice.invoice_number == invoice_number).first()

def get_invoices(db: Session, skip: int = 0, limit: int = 100, customer_id: Optional[int] = None) -> List[Invoice]:
    query = db.query(Invoice)
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    return query.order_by(Invoice.invoice_date.desc()).offset(skip).limit(limit).all()

def create_invoice(db: Session, invoice_in: InvoiceCreate, user_id: int) -> Invoice:
    # 1. Resolve customer or create inline
    customer_id = invoice_in.customer_id
    if not customer_id:
        if invoice_in.customer_name and invoice_in.customer_phone:
            # Check if customer exists by phone
            existing = get_customer_by_phone(db, invoice_in.customer_phone)
            if existing:
                customer_id = existing.id
            else:
                new_cust = Customer(
                    name=invoice_in.customer_name,
                    phone=invoice_in.customer_phone,
                    email=invoice_in.customer_email,
                    address=invoice_in.customer_address
                )
                db.add(new_cust)
                db.flush()  # Populates new_cust.id
                customer_id = new_cust.id
        else:
            raise ValueError("Customer ID or customer details (name, phone) must be provided")

    # 2. Generate unique invoice number
    # Format: INV-[YYYYMMDD]-[Timestamp-seconds]-[random4]
    today_str = datetime.utcnow().strftime("%Y%m%d")
    timestamp_sec = datetime.utcnow().strftime("%H%M%S")
    rand_suffix = random.randint(1000, 9999)
    invoice_num = f"INV-{today_str}-{timestamp_sec}-{rand_suffix}"

    # 3. Create invoice entry
    db_invoice = Invoice(
        invoice_number=invoice_num,
        customer_id=customer_id,
        user_id=user_id,
        subtotal=invoice_in.subtotal,
        making_charges_total=invoice_in.making_charges_total,
        gst_amount=invoice_in.gst_amount,
        discount=invoice_in.discount,
        total_amount=invoice_in.total_amount,
        payment_status=invoice_in.payment_status,
        payment_mode=invoice_in.payment_mode,
        branch=invoice_in.branch
    )
    db.add(db_invoice)
    db.flush()  # Populates db_invoice.id

    # 4. Insert items and decrement stock levels
    for item in invoice_in.items:
        db_item = InvoiceItem(
            invoice_id=db_invoice.id,
            product_id=item.product_id,
            item_name=item.item_name,
            category=item.category,
            weight=item.weight,
            purity=item.purity,
            metal_rate=item.metal_rate,
            making_charge=item.making_charge,
            wastage_percent=item.wastage_percent,
            gst_rate=item.gst_rate,
            amount=item.amount
        )
        db.add(db_item)

        # Update product stock if referenced
        if item.product_id:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                # Decrement stock count
                if product.count > 0:
                    product.count -= 1

    # 5. Insert payment details if the transaction status is Paid or Partial
    if invoice_in.payment_status in ["Paid", "Partial"]:
        payment_amt = invoice_in.total_amount if invoice_in.payment_status == "Paid" else (invoice_in.total_amount - invoice_in.discount) # Simple logic fallback
        db_payment = Payment(
            invoice_id=db_invoice.id,
            amount=payment_amt,
            payment_mode=invoice_in.payment_mode,
            reference_number=invoice_in.payment_reference
        )
        db.add(db_payment)

    db.commit()
    db.refresh(db_invoice)
    return db_invoice


# ==========================================
# Dashboard Stats & Reports
# ==========================================
def get_dashboard_stats(db: Session) -> dict:
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Today's sales (sum total_amount for invoices of today)
    today_sales = db.query(func.sum(Invoice.total_amount)).filter(Invoice.invoice_date >= today_start).scalar() or 0.0
    
    # 2. Today's orders count
    today_orders = db.query(func.count(Invoice.id)).filter(Invoice.invoice_date >= today_start).scalar() or 0
    
    # 3. Active customers count
    active_customers = db.query(func.count(Customer.id)).scalar() or 0
    
    # 4. Low stock products (count < 5)
    low_stock_count = db.query(func.count(Product.id)).filter(Product.count < 5).scalar() or 0
    
    # 5. Recent Invoices
    recent_invoices = db.query(Invoice).order_by(Invoice.invoice_date.desc()).limit(5).all()
    
    # 6. Low Stock Products list
    low_stock_products = db.query(Product).filter(Product.count < 5).order_by(Product.count.asc()).limit(5).all()

    return {
        "today_sales": float(today_sales),
        "today_orders": int(today_orders),
        "active_customers": int(active_customers),
        "low_stock_count": int(low_stock_count),
        "recent_invoices": recent_invoices,
        "low_stock_products": low_stock_products
    }

def get_sales_report(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    query = db.query(Invoice)
    if start_date:
        query = query.filter(Invoice.invoice_date >= start_date)
    if end_date:
        query = query.filter(Invoice.invoice_date <= end_date)
    
    invoices = query.order_by(Invoice.invoice_date.asc()).all()
    
    # Simple analytics calculations
    total_sales = sum(float(inv.total_amount) for inv in invoices)
    total_discount = sum(float(inv.discount) for inv in invoices)
    total_gst = sum(float(inv.gst_amount) for inv in invoices)
    total_making = sum(float(inv.making_charges_total) for inv in invoices)
    
    # Group sales by date (YYYY-MM-DD)
    sales_by_date = {}
    sales_by_category = {"Gold": 0.0, "Silver": 0.0, "Diamond": 0.0, "Other": 0.0}
    
    for inv in invoices:
        date_str = inv.invoice_date.strftime("%Y-%m-%d")
        sales_by_date[date_str] = sales_by_date.get(date_str, 0.0) + float(inv.total_amount)
        for item in inv.items:
            cat = item.category if item.category in sales_by_category else "Other"
            sales_by_category[cat] += float(item.amount)

    date_chart = [{"date": k, "amount": v} for k, v in sorted(sales_by_date.items())]
    category_chart = [{"category": k, "value": v} for k, v in sales_by_category.items()]

    return {
        "summary": {
            "total_sales": total_sales,
            "total_discount": total_discount,
            "total_gst": total_gst,
            "total_making_charges": total_making,
            "invoice_count": len(invoices)
        },
        "sales_by_date": date_chart,
        "sales_by_category": category_chart,
        "invoices": invoices
    }
