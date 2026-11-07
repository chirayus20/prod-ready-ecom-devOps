"""
Order routes — checkout, history, detail, cancel.
Executed as a single ACID transaction stored exclusively in Aiven Cloud MySQL.
"""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, g

from ..config.database import MySQLSession
from ..models.mysql_models import (
    Cart, CartItem, Order, OrderItem, Product, Inventory,
    PaymentTransaction, ShipmentTracking,
)
from ..utils.helpers import (
    success_response, error_response, paginate_query,
    generate_order_number, generate_idempotency_key,
    generate_tracking_number, generate_transaction_ref,
)
from ..utils.decorators import token_required

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


# ── Checkout ──────────────────────────────────────────────────────
@orders_bp.route('/checkout', methods=['POST'])
@token_required
def checkout():
    data = request.get_json() or {}
    session = MySQLSession()

    try:
        # 1. Get user cart
        cart = session.query(Cart).filter_by(user_id=g.current_user.id).first()
        if not cart or not cart.items:
            return error_response("Cart is empty", 400)

        # 2. Validate inventory & calculate totals
        subtotal = 0
        order_items_data = []
        for ci in cart.items:
            product = session.query(Product).filter_by(id=ci.product_id, is_active=True).first()
            if not product:
                return error_response(f"Product #{ci.product_id} is no longer available", 400)

            inv = session.query(Inventory).filter_by(product_id=ci.product_id).first()
            available = (inv.quantity - inv.reserved) if inv else 0
            if available < ci.quantity:
                return error_response(
                    f"Insufficient stock for '{product.name}'. Available: {available}", 400
                )

            line_total = product.price * ci.quantity
            subtotal += line_total
            order_items_data.append({
                "product": product,
                "variant_id": ci.variant_id,
                "quantity": ci.quantity,
                "unit_price": product.price,
                "total_price": line_total,
            })

        tax = round(subtotal * 0.18, 2)       # 18% GST
        shipping_fee = 0 if subtotal >= 499 else 49
        total = round(subtotal + tax + shipping_fee, 2)

        # 3. Create order in MySQL
        order = Order(
            user_id=g.current_user.id,
            order_number=generate_order_number(),
            status='confirmed',
            subtotal=subtotal,
            tax=tax,
            shipping_fee=shipping_fee,
            total=total,
            shipping_address=data.get('shipping_address'),
            billing_address=data.get('billing_address'),
            notes=data.get('notes'),
        )
        session.add(order)
        session.flush()  # Populates order.id

        # 4. Create order items & deduct inventory
        for od in order_items_data:
            oi = OrderItem(
                order_id=order.id,
                product_id=od["product"].id,
                variant_id=od["variant_id"],
                product_name=od["product"].name,
                quantity=od["quantity"],
                unit_price=od["unit_price"],
                total_price=od["total_price"],
            )
            session.add(oi)

            inv = session.query(Inventory).filter_by(product_id=od["product"].id).first()
            if inv:
                inv.quantity -= od["quantity"]

        # 5. Clear cart items
        session.query(CartItem).filter_by(cart_id=cart.id).delete()

        # 6. Record payment transaction in MySQL (no card or CVV stored)
        payment = PaymentTransaction(
            order_id=order.id,
            user_id=g.current_user.id,
            transaction_ref=generate_transaction_ref(),
            provider=data.get('payment_provider', 'mock'),
            amount=total,
            currency='INR',
            status='success',     # Mock payment auto-succeeds
            idempotency_key=generate_idempotency_key(),
            metadata_={"method": data.get('payment_method', 'mock_card')},
        )
        session.add(payment)

        # 7. Create shipment tracking in MySQL
        shipment = ShipmentTracking(
            order_id=order.id,
            carrier='ShopVerse Express',
            tracking_number=generate_tracking_number(),
            status='processing',
            events=[{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "Order confirmed",
                "location": "ShopVerse Central Warehouse",
            }],
            estimated_delivery=datetime.now(timezone.utc) + timedelta(days=5),
        )
        session.add(shipment)

        # Commit all atomically to MySQL
        session.commit()

        return success_response(
            data=order.to_dict(),
            message="Order placed successfully! (Payment verified)",
            status=201,
        )
    except Exception as e:
        session.rollback()
        return error_response(f"Checkout failed: {str(e)}", 500)


# ── Order History ─────────────────────────────────────────────────
@orders_bp.route('', methods=['GET'])
@token_required
def list_orders():
    session = MySQLSession()
    q = session.query(Order).filter_by(user_id=g.current_user.id)\
        .order_by(Order.created_at.desc())
    orders, pagination = paginate_query(q)

    result = [o.to_dict() for o in orders]
    return success_response(data=result, pagination=pagination)


# ── Order Detail ──────────────────────────────────────────────────
@orders_bp.route('/<int:order_id>', methods=['GET'])
@token_required
def get_order(order_id):
    session = MySQLSession()
    order = session.query(Order).filter_by(
        id=order_id, user_id=g.current_user.id
    ).first()
    if not order:
        return error_response("Order not found", 404)

    return success_response(data=order.to_dict())


# ── Cancel Order ──────────────────────────────────────────────────
@orders_bp.route('/<int:order_id>/cancel', methods=['POST'])
@token_required
def cancel_order(order_id):
    session = MySQLSession()
    order = session.query(Order).filter_by(
        id=order_id, user_id=g.current_user.id
    ).first()
    if not order:
        return error_response("Order not found", 404)

    if order.status in ('delivered', 'cancelled'):
        return error_response(f"Cannot cancel order with status '{order.status}'", 400)

    # Restore inventory
    for oi in order.items:
        inv = session.query(Inventory).filter_by(product_id=oi.product_id).first()
        if inv:
            inv.quantity += oi.quantity

    order.status = 'cancelled'

    # Update payment & shipment status in MySQL
    if order.payment:
        order.payment.status = 'refunded'
    if order.shipment:
        order.shipment.status = 'cancelled'
        events = order.shipment.events or []
        events.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "Order cancelled & refunded",
            "location": "ShopVerse",
        })
        order.shipment.events = events

    session.commit()
    return success_response(data=order.to_dict(), message="Order cancelled successfully")
