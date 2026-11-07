"""Payment routes — status and transaction reference (stored in MySQL)."""
from flask import Blueprint, g
from ..config.database import MySQLSession
from ..models.mysql_models import PaymentTransaction
from ..utils.helpers import success_response, error_response
from ..utils.decorators import token_required

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')


@payments_bp.route('/order/<int:order_id>', methods=['GET'])
@token_required
def get_payment(order_id):
    session = MySQLSession()
    payment = session.query(PaymentTransaction).filter_by(
        order_id=order_id, user_id=g.current_user.id
    ).first()
    if not payment:
        return error_response("Payment record not found", 404)
    return success_response(data=payment.to_dict())
