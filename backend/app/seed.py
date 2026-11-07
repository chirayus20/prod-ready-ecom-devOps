"""
Seed script — populates Aiven Cloud MySQL with initial sample data.

Run: python -m app.seed
"""
from werkzeug.security import generate_password_hash
from app.config.database import MySQLSession, mysql_engine
from app.models.mysql_models import (
    MySQLBase, User, Category, Product, ProductVariant, Inventory, Review,
)


def seed():
    print("🌱 Verifying tables & seeding MySQL...")

    # ── Create tables ─────────────────────────────────────────────
    try:
        MySQLBase.metadata.create_all(mysql_engine)
        print("  ✅ MySQL tables created / verified")
    except Exception as e:
        print(f"  ❌ MySQL error: {e}")
        return

    session = MySQLSession()

    # ── Users ─────────────────────────────────────────────────────
    if not session.query(User).filter_by(email="admin@shopverse.com").first():
        admin = User(
            email="admin@shopverse.com",
            password_hash=generate_password_hash("Admin@123"),
            first_name="Admin",
            last_name="ShopVerse",
            role="admin",
        )
        session.add(admin)

    if not session.query(User).filter_by(email="customer@test.com").first():
        customer = User(
            email="customer@test.com",
            password_hash=generate_password_hash("Test@123"),
            first_name="Rahul",
            last_name="Sharma",
            phone="9876543210",
            role="customer",
        )
        session.add(customer)

    session.flush()
    print("  ✅ Users verified")

    # ── Categories ────────────────────────────────────────────────
    if not session.query(Category).first():
        categories = [
            Category(name="Electronics", slug="electronics",
                     description="Smartphones, laptops, headphones & gadgets",
                     image_url="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop"),
            Category(name="Watches", slug="watches",
                     description="Analog, digital & smartwatches",
                     image_url="https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop"),
            Category(name="Sunglasses", slug="sunglasses",
                     description="Aviators, wayfarers & sports sunglasses",
                     image_url="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop"),
            Category(name="Bags", slug="bags",
                     description="Backpacks, laptop bags & handbags",
                     image_url="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"),
            Category(name="Shoes", slug="shoes",
                     description="Sneakers, formals & boots",
                     image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop"),
            Category(name="Clothing", slug="clothing",
                     description="T-shirts, shirts, jackets & more",
                     image_url="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop"),
        ]
        session.add_all(categories)
        session.flush()
        print("  ✅ Categories seeded")

    cats = {c.slug: c.id for c in session.query(Category).all()}

    # ── Products ──────────────────────────────────────────────────
    if not session.query(Product).first():
        products_data = [
            # Electronics
            {"name": "ProMax Wireless Earbuds", "slug": "promax-wireless-earbuds",
             "description": "Premium ANC earbuds with 36hr battery, IPX5 waterproof, crystal-clear audio with deep bass. Perfect for music lovers and professionals.",
             "price": 2999, "compare_price": 5999, "category_id": cats.get("electronics"),
             "brand": "SoundWave", "sku": "EL-001",
             "images": ["https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500&h=500&fit=crop",
                        "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&h=500&fit=crop"]},
            {"name": "UltraBook Pro 15 Laptop", "slug": "ultrabook-pro-15",
             "description": "15.6\" FHD display, Intel i7, 16GB RAM, 512GB SSD. Ultra-thin design for professionals on the go.",
             "price": 64999, "compare_price": 79999, "category_id": cats.get("electronics"),
             "brand": "TechNova", "sku": "EL-002",
             "images": ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop"]},
            {"name": "SmartPhone X12 Pro", "slug": "smartphone-x12-pro",
             "description": "6.7\" AMOLED, 108MP camera, 5000mAh battery, 5G ready. Flagship performance at an amazing price.",
             "price": 24999, "compare_price": 32999, "category_id": cats.get("electronics"),
             "brand": "NexGen", "sku": "EL-003",
             "images": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop"]},
            {"name": "PowerBank Ultra 20000mAh", "slug": "powerbank-ultra-20000",
             "description": "20000mAh fast charging power bank with USB-C PD, LED display. Charge 3 devices simultaneously.",
             "price": 1499, "compare_price": 2499, "category_id": cats.get("electronics"),
             "brand": "ChargeMax", "sku": "EL-004",
             "images": ["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop"]},

            # Watches
            {"name": "ChronoEdge Automatic Watch", "slug": "chronoedge-automatic",
             "description": "Japanese automatic movement, sapphire crystal, 100m water resistance. Classic elegance meets modern engineering.",
             "price": 8999, "compare_price": 14999, "category_id": cats.get("watches"),
             "brand": "TimeCraft", "sku": "WT-001",
             "images": ["https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop"]},
            {"name": "FitPulse Smart Watch", "slug": "fitpulse-smartwatch",
             "description": "AMOLED display, heart rate monitor, SpO2, GPS, 7-day battery. Your complete health companion.",
             "price": 3499, "compare_price": 5999, "category_id": cats.get("watches"),
             "brand": "PulseTech", "sku": "WT-002",
             "images": ["https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=500&h=500&fit=crop"]},
            {"name": "ClassicTone Leather Watch", "slug": "classictone-leather",
             "description": "Minimalist design with genuine leather strap, date display. Timeless style for everyday wear.",
             "price": 2499, "compare_price": 3999, "category_id": cats.get("watches"),
             "brand": "TimeCraft", "sku": "WT-003",
             "images": ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=500&fit=crop"]},

            # Sunglasses
            {"name": "AeroShade Aviator Pro", "slug": "aeroshade-aviator-pro",
             "description": "Polarized UV400 aviator sunglasses with titanium frame. Lightweight and durable for all-day comfort.",
             "price": 1999, "compare_price": 3499, "category_id": cats.get("sunglasses"),
             "brand": "VisionArt", "sku": "SG-001",
             "images": ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop"]},
            {"name": "UrbanVibe Wayfarer", "slug": "urbanvibe-wayfarer",
             "description": "Classic wayfarer design with anti-glare coating. Available in multiple trendy colors.",
             "price": 1499, "compare_price": 2499, "category_id": cats.get("sunglasses"),
             "brand": "VisionArt", "sku": "SG-002",
             "images": ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&h=500&fit=crop"]},

            # Bags
            {"name": "VoyageX Travel Backpack", "slug": "voyagex-travel-backpack",
             "description": "40L expandable backpack with USB charging port, anti-theft pocket, rain cover. Built for urban explorers.",
             "price": 2799, "compare_price": 4999, "category_id": cats.get("bags"),
             "brand": "PackMaster", "sku": "BG-001",
             "images": ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop"]},
            {"name": "EliteCarry Laptop Bag", "slug": "elitecarry-laptop-bag",
             "description": "Fits 15.6\" laptops, padded compartments, water-resistant fabric. Professional look for office and travel.",
             "price": 1999, "compare_price": 3499, "category_id": cats.get("bags"),
             "brand": "PackMaster", "sku": "BG-002",
             "images": ["https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500&h=500&fit=crop"]},

            # Shoes
            {"name": "AirStride Running Shoes", "slug": "airstride-running-shoes",
             "description": "Ultralight mesh upper, responsive foam midsole, rubber outsole. Engineered for speed and comfort.",
             "price": 3999, "compare_price": 6499, "category_id": cats.get("shoes"),
             "brand": "SwiftStep", "sku": "SH-001",
             "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop"]},
            {"name": "ClassicWalk Leather Derby", "slug": "classicwalk-leather-derby",
             "description": "Genuine leather formal derby shoes, cushioned insole, hand-crafted finish. Office-ready elegance.",
             "price": 4499, "compare_price": 6999, "category_id": cats.get("shoes"),
             "brand": "WalkCraft", "sku": "SH-002",
             "images": ["https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&h=500&fit=crop"]},

            # Clothing
            {"name": "ZenFit Premium Cotton Tee", "slug": "zenfit-premium-tee",
             "description": "100% combed cotton, pre-shrunk, tagless design. Incredibly soft with a modern relaxed fit.",
             "price": 799, "compare_price": 1499, "category_id": cats.get("clothing"),
             "brand": "ThreadCraft", "sku": "CL-001",
             "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop"]},
            {"name": "VortexFlex Bomber Jacket", "slug": "vortexflex-bomber",
             "description": "Water-resistant bomber jacket with quilted lining. Modern military-inspired style for cooler days.",
             "price": 3499, "compare_price": 5999, "category_id": cats.get("clothing"),
             "brand": "UrbanEdge", "sku": "CL-002",
             "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop"]},
        ]

        for pd in products_data:
            product = Product(**pd)
            session.add(product)
            session.flush()
            inv = Inventory(product_id=product.id, quantity=50)
            session.add(inv)

        session.commit()
        print(f"  ✅ {len(products_data)} products seeded in MySQL")

    # ── Reviews (MySQL) ───────────────────────────────────────────
    if not session.query(Review).first():
        products = session.query(Product).limit(6).all()
        customer = session.query(User).filter_by(role='customer').first()
        if customer and products:
            sample_reviews = [
                ("Amazing quality!", "Exceeded my expectations. Crisp sound and rich bass! Highly recommend.", 5),
                ("Great build & sleek design", "Very lightweight, feels premium and fast performance.", 5),
                ("Good value for money", "Great product for the price. Fast delivery and battery lasts long.", 4),
                ("Loved the finish!", "Looks even better in real life. Super stylish.", 5),
                ("Solid everyday wear", "Comfortable, looks classy and goes with everything.", 4),
                ("Excellent comfort", "Great cushioning for running and long walks.", 5),
            ]
            for i, (title, body, rating) in enumerate(sample_reviews):
                if i < len(products):
                    review = Review(
                        product_id=products[i].id,
                        user_id=customer.id,
                        rating=rating,
                        title=title,
                        body=body,
                        is_verified=True,
                        is_approved=True,
                    )
                    session.add(review)
            session.commit()
            print("  ✅ Reviews seeded in MySQL")

    print("🎉 Seeding complete! All application data stored in Aiven Cloud MySQL.")


if __name__ == '__main__':
    seed()
