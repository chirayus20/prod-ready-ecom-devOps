"""
MySQL models — consolidated application data stored exclusively on Aiven Cloud MySQL.

Tables: users, addresses, categories, products, product_variants,
        inventory, carts, cart_items, wishlists, orders, order_items,
        payment_transactions, shipment_tracking, reviews, returns_refunds
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime,
    ForeignKey, JSON, Index, UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class MySQLBase(DeclarativeBase):
    pass


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  User & Address
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class User(MySQLBase):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), default='customer')          # customer | admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    addresses = relationship('Address', back_populates='user', cascade='all, delete-orphan')
    orders = relationship('Order', back_populates='user')
    wishlist_items = relationship('Wishlist', back_populates='user', cascade='all, delete-orphan')
    reviews = relationship('Review', back_populates='user', cascade='all, delete-orphan')
    payments = relationship('PaymentTransaction', back_populates='user')

    def to_dict(self, include_email=False):
        d = {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_email:
            d["email"] = self.email
        return d


class Address(MySQLBase):
    __tablename__ = 'addresses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    label = Column(String(50), default='home')             # home | work | other
    street = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    country = Column(String(100), default='India')
    is_default = Column(Boolean, default=False)

    user = relationship('User', back_populates='addresses')

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Catalog
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Category(MySQLBase):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    parent_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    is_active = Column(Boolean, default=True)

    parent = relationship('Category', remote_side=[id], backref='children')
    products = relationship('Product', back_populates='category')

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Product(MySQLBase):
    __tablename__ = 'products'
    __table_args__ = (
        Index('ix_products_category', 'category_id'),
        Index('ix_products_brand', 'brand'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(280), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    compare_price = Column(Float, nullable=True)           # original / MRP
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    brand = Column(String(100), nullable=True)
    sku = Column(String(100), unique=True, nullable=False)
    images = Column(JSON, nullable=True)                   # list of URLs
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    category = relationship('Category', back_populates='products')
    variants = relationship('ProductVariant', back_populates='product', cascade='all, delete-orphan')
    inventory = relationship('Inventory', back_populates='product', cascade='all, delete-orphan')
    reviews = relationship('Review', back_populates='product', cascade='all, delete-orphan')

    def to_dict(self):
        approved_reviews = [r for r in self.reviews if r.is_approved] if self.reviews else []
        avg_rating = round(sum(r.rating for r in approved_reviews) / len(approved_reviews), 1) if approved_reviews else 0
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "price": self.price,
            "compare_price": self.compare_price,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "brand": self.brand,
            "sku": self.sku,
            "images": self.images or [],
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "stock": sum(inv.quantity - inv.reserved for inv in self.inventory) if self.inventory else 0,
            "avg_rating": avg_rating,
            "review_count": len(approved_reviews),
        }


class ProductVariant(MySQLBase):
    __tablename__ = 'product_variants'

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(100), nullable=False)             # e.g. "Black / XL"
    sku = Column(String(100), unique=True, nullable=False)
    price_adjustment = Column(Float, default=0)
    attributes = Column(JSON, nullable=True)               # {"color":"black","size":"XL"}
    is_active = Column(Boolean, default=True)

    product = relationship('Product', back_populates='variants')

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Inventory(MySQLBase):
    __tablename__ = 'inventory'
    __table_args__ = (
        UniqueConstraint('product_id', 'variant_id', name='uq_inventory_product_variant'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    variant_id = Column(Integer, ForeignKey('product_variants.id', ondelete='SET NULL'), nullable=True)
    quantity = Column(Integer, default=0)
    reserved = Column(Integer, default=0)                  # reserved during checkout
    warehouse = Column(String(100), default='main')

    product = relationship('Product', back_populates='inventory')

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Cart
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Cart(MySQLBase):
    __tablename__ = 'carts'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    session_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    items = relationship('CartItem', back_populates='cart', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "items": [i.to_dict() for i in self.items],
            "total": sum(i.quantity * (i.product.price if i.product else 0) for i in self.items),
        }


class CartItem(MySQLBase):
    __tablename__ = 'cart_items'
    __table_args__ = (
        UniqueConstraint('cart_id', 'product_id', 'variant_id', name='uq_cart_product_variant'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    cart_id = Column(Integer, ForeignKey('carts.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    variant_id = Column(Integer, ForeignKey('product_variants.id', ondelete='SET NULL'), nullable=True)
    quantity = Column(Integer, default=1)

    cart = relationship('Cart', back_populates='items')
    product = relationship('Product')

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "variant_id": self.variant_id,
            "quantity": self.quantity,
            "product": self.product.to_dict() if self.product else None,
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Wishlist
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Wishlist(MySQLBase):
    __tablename__ = 'wishlists'
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='uq_wishlist_user_product'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship('User', back_populates='wishlist_items')
    product = relationship('Product')

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product": self.product.to_dict() if self.product else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Orders
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Order(MySQLBase):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    order_number = Column(String(50), unique=True, nullable=False)
    status = Column(String(30), default='pending')         # pending|confirmed|shipped|delivered|cancelled
    subtotal = Column(Float, default=0)
    tax = Column(Float, default=0)
    shipping_fee = Column(Float, default=0)
    total = Column(Float, default=0)
    shipping_address = Column(JSON, nullable=True)
    billing_address = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    user = relationship('User', back_populates='orders')
    items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')
    payment = relationship('PaymentTransaction', back_populates='order', uselist=False, cascade='all, delete-orphan')
    shipment = relationship('ShipmentTracking', back_populates='order', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "user_id": self.user_id,
            "status": self.status,
            "subtotal": self.subtotal,
            "tax": self.tax,
            "shipping_fee": self.shipping_fee,
            "total": self.total,
            "shipping_address": self.shipping_address,
            "billing_address": self.billing_address,
            "notes": self.notes,
            "items": [i.to_dict() for i in self.items],
            "payment": self.payment.to_dict() if self.payment else None,
            "shipment": self.shipment.to_dict() if self.shipment else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OrderItem(MySQLBase):
    __tablename__ = 'order_items'

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    variant_id = Column(Integer, ForeignKey('product_variants.id'), nullable=True)
    product_name = Column(String(255), nullable=False)     # snapshot at time of order
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    order = relationship('Order', back_populates='items')
    product = relationship('Product')

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "variant_id": self.variant_id,
            "product_name": self.product_name,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "total_price": self.total_price,
            "product_image": (self.product.images[0] if self.product and self.product.images else None),
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Payments (Consolidated to MySQL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class PaymentTransaction(MySQLBase):
    __tablename__ = 'payment_transactions'
    __table_args__ = (
        Index('ix_payment_order', 'order_id'),
        UniqueConstraint('idempotency_key', name='uq_payment_idempotency'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    transaction_ref = Column(String(255), unique=True, nullable=False)
    provider = Column(String(50), default='mock')          # mock | razorpay | stripe
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default='INR')
    status = Column(String(30), default='pending')         # pending | success | failed | refunded
    idempotency_key = Column(String(255), nullable=False)
    metadata_ = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    order = relationship('Order', back_populates='payment')
    user = relationship('User', back_populates='payments')

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "transaction_ref": self.transaction_ref,
            "provider": self.provider,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Shipments (Consolidated to MySQL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class ShipmentTracking(MySQLBase):
    __tablename__ = 'shipment_tracking'
    __table_args__ = (
        Index('ix_shipment_order', 'order_id'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    carrier = Column(String(100), default='ShopVerse Express')
    tracking_number = Column(String(100), unique=True, nullable=True)
    status = Column(String(30), default='processing')      # processing | shipped | in_transit | delivered | cancelled
    events = Column(JSON, nullable=True)                   # [{timestamp, location, status, note}]
    estimated_delivery = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    order = relationship('Order', back_populates='shipment')

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "carrier": self.carrier,
            "tracking_number": self.tracking_number,
            "status": self.status,
            "events": self.events or [],
            "estimated_delivery": self.estimated_delivery.isoformat() if self.estimated_delivery else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Reviews (Consolidated to MySQL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Review(MySQLBase):
    __tablename__ = 'reviews'
    __table_args__ = (
        Index('ix_review_product', 'product_id'),
        UniqueConstraint('product_id', 'user_id', name='uq_review_product_user'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    rating = Column(Integer, nullable=False)               # 1-5
    title = Column(String(255), nullable=True)
    body = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    product = relationship('Product', back_populates='reviews')
    user = relationship('User', back_populates='reviews')

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "user_id": self.user_id,
            "reviewer_name": f"{self.user.first_name} {self.user.last_name}" if self.user else "Customer",
            "rating": self.rating,
            "title": self.title,
            "body": self.body,
            "is_verified": self.is_verified,
            "is_approved": self.is_approved,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Returns & Refunds (Consolidated to MySQL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class ReturnRefund(MySQLBase):
    __tablename__ = 'returns_refunds'
    __table_args__ = (
        Index('ix_return_order', 'order_id'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    order_item_id = Column(Integer, ForeignKey('order_items.id', ondelete='SET NULL'), nullable=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(20), default='return')            # return | refund
    reason = Column(Text, nullable=True)
    status = Column(String(30), default='requested')       # requested | approved | rejected | completed
    refund_amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "order_item_id": self.order_item_id,
            "user_id": self.user_id,
            "type": self.type,
            "reason": self.reason,
            "status": self.status,
            "refund_amount": self.refund_amount,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
