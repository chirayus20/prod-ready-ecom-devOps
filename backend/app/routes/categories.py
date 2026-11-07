"""Category routes."""
from flask import Blueprint, request
from ..config.database import MySQLSession
from ..models.mysql_models import Category
from ..utils.helpers import success_response, error_response

categories_bp = Blueprint('categories', __name__, url_prefix='/api/categories')


@categories_bp.route('', methods=['GET'])
def list_categories():
    session = MySQLSession()
    cats = session.query(Category).filter_by(is_active=True, parent_id=None).all()
    result = []
    for c in cats:
        d = c.to_dict()
        children = c.children if hasattr(c, 'children') and isinstance(c.children, list) else []
        d['children'] = [ch.to_dict() for ch in children if getattr(ch, 'is_active', True)]
        result.append(d)
    return success_response(data=result)


@categories_bp.route('/<int:cat_id>', methods=['GET'])
def get_category(cat_id):
    session = MySQLSession()
    cat = session.query(Category).filter_by(id=cat_id, is_active=True).first()
    if not cat:
        return error_response("Category not found", 404)
    return success_response(data=cat.to_dict())
