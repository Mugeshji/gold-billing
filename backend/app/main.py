from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.routers import auth, products, customers, billing, reports
from app.models import Product, User
from app.auth import get_password_hash

# Initialize database tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables verified/created successfully.")
except Exception as e:
    print(f"Error during database table creation: {e}")

app = FastAPI(
    title="Kaiya Luxury Jewel Billing API",
    description="Backend API for premium gold and silver jewelry showrooms",
    version="1.0.0"
)

# Configure CORS for Frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.on_event("startup")
def seed_initial_data():
    db = next(get_db())
    try:
        # 1. Seed initial admin user if no users exist
        # Username: admin, Password: admin123
        if db.query(User).count() == 0:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role="Admin"
            )
            staff_user = User(
                username="staff",
                password_hash=get_password_hash("staff123"),
                role="Staff"
            )
            db.add(admin_user)
            db.add(staff_user)
            db.commit()
            print("Seeded default users: admin (admin123) and staff (staff123)")

        # 2. Seed initial showroom products if inventory is empty
        if db.query(Product).count() == 0:
            sample_products = [
                Product(
                    code="PRD-G001",
                    name="Royal Antique Gold Ring",
                    category="Gold",
                    purity="22K",
                    weight=6.500,
                    count=12,
                    price_per_gram=6150.00,
                    making_charge_per_gram=450.00,
                    wastage_percentage=3.50
                ),
                Product(
                    code="PRD-G002",
                    name="Bridal Gold Choker Necklace",
                    category="Gold",
                    purity="22K",
                    weight=42.800,
                    count=3,
                    price_per_gram=6150.00,
                    making_charge_per_gram=650.00,
                    wastage_percentage=5.00
                ),
                Product(
                    code="PRD-S001",
                    name="Premium Silver Figaro Chain",
                    category="Silver",
                    purity="925 Sterling",
                    weight=18.400,
                    count=25,
                    price_per_gram=95.00,
                    making_charge_per_gram=25.00,
                    wastage_percentage=1.00
                ),
                Product(
                    code="PRD-D001",
                    name="Solitaire Diamond Stud Earrings",
                    category="Diamond",
                    purity="18K White Gold",
                    weight=4.200,
                    count=5,
                    price_per_gram=5200.00,
                    making_charge_per_gram=1200.00,  # higher making charge for diamonds
                    wastage_percentage=2.00
                ),
                Product(
                    code="PRD-G003",
                    name="Classic Gold Kada Bangle",
                    category="Gold",
                    purity="22K",
                    weight=24.150,
                    count=8,
                    price_per_gram=6150.00,
                    making_charge_per_gram=380.00,
                    wastage_percentage=4.00
                ),
            ]
            db.add_all(sample_products)
            db.commit()
            print("Seeded sample jewelry inventory products successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding initial database values: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Kaiya Luxury Jewel Billing Software Backend",
        "database": "MySQL",
        "health": "excellent"
    }
