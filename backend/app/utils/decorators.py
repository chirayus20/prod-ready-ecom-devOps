"""Auth decorators for JWT token validation and role-based access control."""
from functools import wraps
from flask import request, g
import jwt
from ..config.settings import Config
from ..config.database import MySQLSession
from ..models.mysql_models import User
from ..utils.helpers import error_response


def token_required(f):
    """Decorator that verifies JWT token and attaches user to g.current_user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        if not token:
            return error_response("Authentication token is missing", 401)

        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            session = MySQLSession()
            user = session.query(User).filter_by(id=payload['user_id']).first()
            if not user or not user.is_active:
                return error_response("Invalid or deactivated user", 401)
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return error_response("Token has expired", 401)
        except jwt.InvalidTokenError:
            return error_response("Invalid token", 401)

        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator that ensures the authenticated user has admin role."""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.current_user.role != 'admin':
            return error_response("Admin access required", 403)
        return f(*args, **kwargs)
    return decorated
