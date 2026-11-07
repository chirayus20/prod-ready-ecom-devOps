"""Cart routes — add, update, remove items, get cart."""
from flask import Blueprint, request, g
from ..config.database import MySQLSession
from ..models.mysql_models import Cart, CartItem, Product
from ..utils.helpers import success_response, error_response
from ..utils.decorators import token_required

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')


def _get_or_create_cart(session, user_id):
    cart = session.query(Cart).filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        session.add(cart)
        session.flush()
    return cart


@cart_bp.route('', methods=['GET'])
@token_required
def get_cart():
    session = MySQLSession()
    cart = _get_or_create_cart(session, g.current_user.id)
    session.commit()
    return success_response(data=cart.to_dict())


@cart_bp.route('/items', methods=['POST'])
@token_required
def add_to_cart():
    data = request.get_json() or {}
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    variant_id = data.get('variant_id')

    if not product_id:
        return error_response("'product_id' is required", 400)

    session = MySQLSession()
    product = session.query(Product).filter_by(id=product_id, is_active=True).first()
    if not product:
        return error_response("Product not found", 404)

    cart = _get_or_create_cart(session, g.current_user.id)

    # Check if item already in cart
    existing = session.query(CartItem).filter_by(
        cart_id=cart.id, product_id=product_id, variant_id=variant_id
    ).first()

    if existing:
        existing.quantity += quantity
    else:
        item = CartItem(cart_id=cart.id, product_id=product_id,
                        variant_id=variant_id, quantity=quantity)
        session.add(item)

    session.commit()
    return success_response(data=cart.to_dict(), message="Item added to cart")


@cart_bp.route('/items/<int:item_id>', methods=['PUT'])
@token_required
def update_cart_item(item_id):
    data = request.get_json() or {}
    quantity = data.get('quantity', 1)

    session = MySQLSession()
    cart = _get_or_create_cart(session, g.current_user.id)
    item = session.query(CartItem).filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return error_response("Cart item not found", 404)

    if quantity <= 0:
        session.delete(item)
    else:
        item.quantity = quantity

    session.commit()
    return success_response(data=cart.to_dict(), message="Cart updated")


@cart_bp.route('/items/<int:item_id>', methods=['DELETE'])
@token_required
def remove_cart_item(item_id):
    session = MySQLSession()
    cart = _get_or_create_cart(session, g.current_user.id)
    item = session.query(CartItem).filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return error_response("Cart item not found", 404)

    session.delete(item)
    session.commit()
    return success_response(data=cart.to_dict(), message="Item removed")


@cart_bp.route('', methods=['DELETE'])
@token_required
def clear_cart():
    session = MySQLSession()
    cart = session.query(Cart).filter_by(user_id=g.current_user.id).first()
    if cart:
        session.query(CartItem).filter_by(cart_id=cart.id).delete()
        session.commit()
    return success_response(message="Cart cleared")
