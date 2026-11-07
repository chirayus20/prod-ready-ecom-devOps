"""Shared helper utilities."""
import uuid
import math
from flask import jsonify, request


def generate_order_number():
    """Generate a unique order number like SV-A1B2C3D4."""
    return f"SV-{uuid.uuid4().hex[:8].upper()}"


def generate_idempotency_key():
    """Generate a unique idempotency key for payment processing."""
    return uuid.uuid4().hex


def generate_tracking_number():
    """Generate a mock tracking number."""
    return f"SVX{uuid.uuid4().hex[:10].upper()}"


def generate_transaction_ref():
    """Generate a mock transaction reference."""
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"


def paginate_query(query, model=None):
    """Apply pagination to a SQLAlchemy query.
    
    Returns (items, pagination_meta).
    Uses ?page=1&per_page=12 from query string.
    """
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 12, type=int), 100)

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return items, {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": math.ceil(total / per_page) if per_page else 0,
    }


def success_response(data=None, message="Success", status=200, **extra):
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    body.update(extra)
    return jsonify(body), status


def error_response(message="Error", status=400, **extra):
    body = {"success": False, "error": message}
    body.update(extra)
    return jsonify(body), status
