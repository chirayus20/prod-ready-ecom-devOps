"""Wishlist routes."""
from flask import Blueprint, g
from ..config.database import MySQLSession
from ..models.mysql_models import Wishlist, Product
from ..utils.helpers import success_response, error_response
from ..utils.decorators import token_required

wishlist_bp = Blueprint('wishlist', __name__, url_prefix='/api/wishlist')


@wishlist_bp.route('', methods=['GET'])
@token_required
def get_wishlist():
    session = MySQLSession()
    items = session.query(Wishlist).filter_by(user_id=g.current_user.id).all()
    return success_response(data=[i.to_dict() for i in items])


@wishlist_bp.route('/<int:product_id>', methods=['POST'])
@token_required
def add_to_wishlist(product_id):
    session = MySQLSession()
    product = session.query(Product).filter_by(id=product_id, is_active=True).first()
    if not product:
        return error_response("Product not found", 404)

    existing = session.query(Wishlist).filter_by(
        user_id=g.current_user.id, product_id=product_id).first()
    if existing:
        return success_response(message="Already in wishlist")

    w = Wishlist(user_id=g.current_user.id, product_id=product_id)
    session.add(w)
    session.commit()
    return success_response(data=w.to_dict(), message="Added to wishlist", status=201)


@wishlist_bp.route('/<int:product_id>', methods=['DELETE'])
@token_required
def remove_from_wishlist(product_id):
    session = MySQLSession()
    w = session.query(Wishlist).filter_by(
        user_id=g.current_user.id, product_id=product_id).first()
    if not w:
        return error_response("Not in wishlist", 404)
    session.delete(w)
    session.commit()
    return success_response(message="Removed from wishlist")
