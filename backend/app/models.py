import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="Staff")  # Admin, Staff
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    invoices = relationship("Invoice", back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # Barcode / SKU
    name = Column(String(150), index=True, nullable=False)
    category = Column(String(50), index=True, nullable=False)  # Gold, Silver, Diamond, Other
    purity = Column(String(50), nullable=False)  # 22K, 18K, 24K, 925, etc.
    weight = Column(Numeric(10, 3), nullable=False)  # Weight in grams
    count = Column(Integer, nullable=False, default=0)  # Quantity in stock
    price_per_gram = Column(Numeric(12, 2), nullable=False, default=0.00)  # Base metal rate per gram
    making_charge_per_gram = Column(Numeric(12, 2), nullable=False, default=0.00)
    wastage_percentage = Column(Numeric(5, 2), nullable=False, default=0.00)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    invoice_items = relationship("InvoiceItem", back_populates="product")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    invoices = relationship("Invoice", back_populates="customer")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invoice_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    subtotal = Column(Numeric(12, 2), nullable=False)
    making_charges_total = Column(Numeric(12, 2), nullable=False)
    gst_amount = Column(Numeric(12, 2), nullable=False)  # Total GST (3%)
    discount = Column(Numeric(12, 2), nullable=False, default=0.00)
    total_amount = Column(Numeric(12, 2), nullable=False)
    payment_status = Column(String(20), nullable=False, default="Paid")  # Paid, Partial, Unpaid
    payment_mode = Column(String(50), nullable=False, default="Cash")  # Cash, Card, UPI, Bank Transfer
    branch = Column(String(100), nullable=False, default="Main Branch")

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    user = relationship("User", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    item_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # Gold, Silver, Diamond, Other
    weight = Column(Numeric(10, 3), nullable=False)
    purity = Column(String(50), nullable=False)
    metal_rate = Column(Numeric(12, 2), nullable=False)
    making_charge = Column(Numeric(12, 2), nullable=False)
    wastage_percent = Column(Numeric(5, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), nullable=False, default=3.00)
    amount = Column(Numeric(12, 2), nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product", back_populates="invoice_items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_mode = Column(String(50), nullable=False)
    reference_number = Column(String(100), nullable=True)

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
