"""Authentication routes — register, login, profile."""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, g
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

from ..config.settings import Config
from ..config.database import MySQLSession
from ..models.mysql_models import User, Address
from ..utils.helpers import success_response, error_response
from ..utils.decorators import token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _create_token(user):
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')


# ── Register ──────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    required = ['email', 'password', 'first_name', 'last_name']
    for field in required:
        if not data.get(field):
            return error_response(f"'{field}' is required", 400)

    session = MySQLSession()
    if session.query(User).filter_by(email=data['email']).first():
        return error_response("Email already registered", 409)

    user = User(
        email=data['email'].lower().strip(),
        password_hash=generate_password_hash(data['password']),
        first_name=data['first_name'],
        last_name=data['last_name'],
        phone=data.get('phone'),
        role='customer',
    )
    session.add(user)
    session.commit()

    token = _create_token(user)
    return success_response(
        data={"user": user.to_dict(include_email=True), "token": token},
        message="Registration successful",
        status=201,
    )


# ── Login ─────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    if not data.get('email') or not data.get('password'):
        return error_response("Email and password are required", 400)

    session = MySQLSession()
    user = session.query(User).filter_by(email=data['email'].lower().strip()).first()

    if not user or not check_password_hash(user.password_hash, data['password']):
        return error_response("Invalid email or password", 401)

    if not user.is_active:
        return error_response("Account is deactivated", 403)

    token = _create_token(user)
    return success_response(
        data={"user": user.to_dict(include_email=True), "token": token},
        message="Login successful",
    )


# ── Profile ───────────────────────────────────────────────────────
@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    user = g.current_user
    session = MySQLSession()
    addresses = session.query(Address).filter_by(user_id=user.id).all()
    return success_response(data={
        "user": user.to_dict(include_email=True),
        "addresses": [a.to_dict() for a in addresses],
    })


@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    data = request.get_json() or {}
    user = g.current_user
    session = MySQLSession()

    if data.get('first_name'):
        user.first_name = data['first_name']
    if data.get('last_name'):
        user.last_name = data['last_name']
    if data.get('phone'):
        user.phone = data['phone']

    session.commit()
    return success_response(data={"user": user.to_dict(include_email=True)}, message="Profile updated")


# ── Addresses ─────────────────────────────────────────────────────
@auth_bp.route('/addresses', methods=['GET'])
@token_required
def get_addresses():
    session = MySQLSession()
    addresses = session.query(Address).filter_by(user_id=g.current_user.id).all()
    return success_response(data=[a.to_dict() for a in addresses])


@auth_bp.route('/addresses', methods=['POST'])
@token_required
def add_address():
    data = request.get_json() or {}
    required = ['street', 'city', 'state', 'zip_code']
    for f in required:
        if not data.get(f):
            return error_response(f"'{f}' is required", 400)

    session = MySQLSession()
    addr = Address(
        user_id=g.current_user.id,
        label=data.get('label', 'home'),
        street=data['street'],
        city=data['city'],
        state=data['state'],
        zip_code=data['zip_code'],
        country=data.get('country', 'India'),
        is_default=data.get('is_default', False),
    )
    if addr.is_default:
        session.query(Address).filter_by(user_id=g.current_user.id).update({"is_default": False})
    session.add(addr)
    session.commit()
    return success_response(data=addr.to_dict(), message="Address added", status=201)
