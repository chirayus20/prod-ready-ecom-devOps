"""Returns & refund routes (stored in MySQL)."""
from flask import Blueprint, request, g

from ..config.database import MySQLSession
from ..models.mysql_models import ReturnRefund, Order
from ..utils.helpers import success_response, error_response
from ..utils.decorators import token_required

returns_bp = Blueprint('returns', __name__, url_prefix='/api/returns')


@returns_bp.route('', methods=['POST'])
@token_required
def request_return():
    data = request.get_json() or {}
    order_id = data.get('order_id')
    if not order_id:
        return error_response("'order_id' is required", 400)

    session = MySQLSession()
    order = session.query(Order).filter_by(
        id=order_id, user_id=g.current_user.id).first()
    if not order:
        return error_response("Order not found", 404)
    if order.status not in ('delivered', 'confirmed', 'shipped'):
        return error_response("Order is not eligible for return", 400)

    existing = session.query(ReturnRefund).filter_by(
        order_id=order_id, user_id=g.current_user.id).first()
    if existing:
        return error_response("Return already requested", 409)

    ret = ReturnRefund(
        order_id=order_id,
        order_item_id=data.get('order_item_id'),
        user_id=g.current_user.id,
        type=data.get('type', 'return'),
        reason=data.get('reason', ''),
        refund_amount=order.total,
    )
    session.add(ret)
    session.commit()
    return success_response(data=ret.to_dict(), message="Return requested", status=201)


@returns_bp.route('', methods=['GET'])
@token_required
def list_returns():
    session = MySQLSession()
    items = session.query(ReturnRefund).filter_by(
        user_id=g.current_user.id
    ).order_by(ReturnRefund.created_at.desc()).all()
    return success_response(data=[i.to_dict() for i in items])
