"""
Admin dashboard & management routes.
Consolidated to Aiven Cloud MySQL with product image upload.
"""
from flask import Blueprint, request
from sqlalchemy import func

from ..config.database import MySQLSession
from ..models.mysql_models import (
    User, Product, Category, Order, OrderItem, Inventory, ProductVariant,
    PaymentTransaction, ShipmentTracking, Review, ReturnRefund,
)
from ..utils.helpers import success_response, error_response, paginate_query
from ..utils.decorators import admin_required
from ..services.storage_service import get_storage_service

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ── Dashboard (MySQL Stats) ───────────────────────────────────────
@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    session = MySQLSession()

    total_products = session.query(func.count(Product.id)).scalar() or 0
    total_orders = session.query(func.count(Order.id)).scalar() or 0
    total_revenue = session.query(func.sum(Order.total)).filter(
        Order.status != 'cancelled').scalar() or 0
    total_customers = session.query(func.count(User.id)).filter_by(role='customer').scalar() or 0
    pending_orders = session.query(func.count(Order.id)).filter_by(status='pending').scalar() or 0
    low_stock = session.query(func.count(Inventory.id)).filter(
        (Inventory.quantity - Inventory.reserved) < 10).scalar() or 0

    recent_orders = session.query(Order).order_by(Order.created_at.desc()).limit(5).all()

    total_reviews = session.query(func.count(Review.id)).scalar() or 0
    avg_rating = session.query(func.avg(Review.rating)).scalar() or 0
    total_payments = session.query(func.count(PaymentTransaction.id)).filter_by(status='success').scalar() or 0
    pending_returns = session.query(func.count(ReturnRefund.id)).filter_by(status='requested').scalar() or 0

    return success_response(data={
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": round(float(total_revenue), 2),
        "total_customers": total_customers,
        "pending_orders": pending_orders,
        "low_stock_count": low_stock,
        "total_reviews": total_reviews,
        "avg_rating": round(float(avg_rating), 1),
        "total_payments": total_payments,
        "pending_returns": pending_returns,
        "recent_orders": [o.to_dict() for o in recent_orders],
    })


# ── Product Image Upload (Local or S3-ready) ─────────────────────
@admin_bp.route('/products/upload-image', methods=['POST'])
@admin_bp.route('/upload', methods=['POST'])
@admin_required
def upload_product_image():
    """Uploads a product image file and returns its URL."""
    file = request.files.get('file') or request.files.get('image')
    if not file:
        return error_response("No image file provided in request", 400)

    try:
        storage = get_storage_service()
        image_url = storage.save_file(file)
        return success_response(
            data={"url": image_url, "filename": file.filename},
            message="Image uploaded successfully",
            status=201,
        )
    except ValueError as ve:
        return error_response(str(ve), 400)
    except Exception as e:
        return error_response(f"Upload failed: {str(e)}", 500)


# ── Product Management ───────────────────────────────────────────
@admin_bp.route('/products', methods=['GET'])
@admin_required
def list_all_products():
    session = MySQLSession()
    q = session.query(Product).order_by(Product.created_at.desc())
    products, pagination = paginate_query(q)
    return success_response(data=[p.to_dict() for p in products], pagination=pagination)


@admin_bp.route('/products', methods=['POST'])
@admin_required
def create_product():
    data = request.get_json() or {}
    required = ['name', 'price', 'sku']
    for f in required:
        if not data.get(f):
            return error_response(f"'{f}' is required", 400)

    session = MySQLSession()

    slug = data['name'].lower().replace(' ', '-').replace('/', '-')
    existing = session.query(Product).filter_by(slug=slug).first()
    if existing:
        slug += f"-{data['sku'].lower()}"

    product = Product(
        name=data['name'],
        slug=slug,
        description=data.get('description', ''),
        price=float(data['price']),
        compare_price=float(data['compare_price']) if data.get('compare_price') else None,
        category_id=data.get('category_id'),
        brand=data.get('brand', ''),
        sku=data['sku'],
        images=data.get('images', []),
    )
    session.add(product)
    session.flush()

    # Create default inventory
    inv = Inventory(product_id=product.id, quantity=data.get('stock', 50))
    session.add(inv)

    # Create variants if provided
    for v in data.get('variants', []):
        variant = ProductVariant(
            product_id=product.id,
            name=v.get('name', ''),
            sku=v.get('sku', f"{data['sku']}-{v.get('name', '').replace(' ', '')}"),
            price_adjustment=v.get('price_adjustment', 0),
            attributes=v.get('attributes', {}),
        )
        session.add(variant)

    session.commit()
    return success_response(data=product.to_dict(), message="Product created successfully", status=201)


@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    data = request.get_json() or {}
    session = MySQLSession()
    product = session.query(Product).filter_by(id=product_id).first()
    if not product:
        return error_response("Product not found", 404)

    for field in ['name', 'description', 'price', 'compare_price', 'brand',
                  'category_id', 'images', 'is_active']:
        if field in data:
            setattr(product, field, data[field])

    # Update inventory
    if 'stock' in data:
        inv = session.query(Inventory).filter_by(product_id=product_id).first()
        if inv:
            inv.quantity = int(data['stock'])
        else:
            session.add(Inventory(product_id=product_id, quantity=int(data['stock'])))

    session.commit()
    return success_response(data=product.to_dict(), message="Product updated successfully")


@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    session = MySQLSession()
    product = session.query(Product).filter_by(id=product_id).first()
    if not product:
        return error_response("Product not found", 404)
    product.is_active = False  # Soft delete
    session.commit()
    return success_response(message="Product deactivated successfully")


# ── Order Management ─────────────────────────────────────────────
@admin_bp.route('/orders', methods=['GET'])
@admin_required
def list_all_orders():
    session = MySQLSession()
    status_filter = request.args.get('status')
    q = session.query(Order).order_by(Order.created_at.desc())
    if status_filter:
        q = q.filter_by(status=status_filter)
    orders, pagination = paginate_query(q)
    return success_response(data=[o.to_dict() for o in orders], pagination=pagination)


@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    data = request.get_json() or {}
    new_status = data.get('status')
    if not new_status:
        return error_response("'status' is required", 400)

    session = MySQLSession()
    order = session.query(Order).filter_by(id=order_id).first()
    if not order:
        return error_response("Order not found", 404)

    order.status = new_status

    if order.shipment:
        status_map = {
            'confirmed': 'processing',
            'shipped': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled',
        }
        order.shipment.status = status_map.get(new_status, order.shipment.status)
        from datetime import datetime, timezone
        events = order.shipment.events or []
        events.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": f"Order {new_status}",
            "location": "ShopVerse",
        })
        order.shipment.events = events

    session.commit()
    return success_response(data=order.to_dict(), message=f"Order status updated to '{new_status}'")


# ── Customer Management ──────────────────────────────────────────
@admin_bp.route('/customers', methods=['GET'])
@admin_required
def list_customers():
    session = MySQLSession()
    q = session.query(User).filter_by(role='customer').order_by(User.created_at.desc())
    users, pagination = paginate_query(q)
    return success_response(
        data=[u.to_dict(include_email=True) for u in users],
        pagination=pagination,
    )
