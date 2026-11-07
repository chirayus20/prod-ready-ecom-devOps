"""Product routes — listing, search, filter, detail (stored in MySQL)."""
from flask import Blueprint, request
from sqlalchemy import or_, func

from ..config.database import MySQLSession
from ..models.mysql_models import Product, Category, Inventory, Review
from ..utils.helpers import success_response, error_response, paginate_query

products_bp = Blueprint('products', __name__, url_prefix='/api/products')


@products_bp.route('', methods=['GET'])
def list_products():
    """List products with search, filter, sort, pagination."""
    session = MySQLSession()
    q = session.query(Product).filter(Product.is_active == True)

    # Search (Title, Brand, Description)
    search = request.args.get('search', '').strip()
    if search:
        q = q.filter(or_(
            Product.name.ilike(f'%{search}%'),
            Product.brand.ilike(f'%{search}%'),
            Product.description.ilike(f'%{search}%'),
        ))

    # Filter by category_id
    category_id = request.args.get('category_id', type=int)
    if category_id:
        q = q.filter(Product.category_id == category_id)

    # Filter by category slug
    category_slug = request.args.get('category')
    if category_slug:
        cat = session.query(Category).filter_by(slug=category_slug).first()
        if cat:
            q = q.filter(Product.category_id == cat.id)

    # Filter by brand
    brand = request.args.get('brand')
    if brand:
        q = q.filter(Product.brand.ilike(f'%{brand}%'))

    # Price range
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    if min_price is not None:
        q = q.filter(Product.price >= min_price)
    if max_price is not None:
        q = q.filter(Product.price <= max_price)

    # Sort
    sort = request.args.get('sort', 'newest')
    if sort == 'price_asc':
        q = q.order_by(Product.price.asc())
    elif sort == 'price_desc':
        q = q.order_by(Product.price.desc())
    elif sort == 'name':
        q = q.order_by(Product.name.asc())
    else:
        q = q.order_by(Product.created_at.desc())

    products, pagination = paginate_query(q)

    # Fetch ratings from MySQL
    product_ids = [p.id for p in products]
    ratings_map = {}
    if product_ids:
        rating_rows = session.query(
            Review.product_id,
            func.avg(Review.rating).label('avg_rating'),
            func.count(Review.id).label('review_count'),
        ).filter(
            Review.product_id.in_(product_ids),
            Review.is_approved == True,
        ).group_by(Review.product_id).all()

        for row in rating_rows:
            ratings_map[row.product_id] = {
                "avg_rating": round(float(row.avg_rating), 1),
                "review_count": row.review_count,
            }

    result = []
    for p in products:
        d = p.to_dict()
        r = ratings_map.get(p.id, {"avg_rating": 0, "review_count": 0})
        d.update(r)
        result.append(d)

    return success_response(data=result, pagination=pagination)


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get product detail with reviews from MySQL."""
    session = MySQLSession()
    product = session.query(Product).filter_by(id=product_id, is_active=True).first()
    if not product:
        return error_response("Product not found", 404)

    data = product.to_dict()
    data["variants"] = [v.to_dict() for v in product.variants if v.is_active]

    # Fetch reviews from MySQL directly
    reviews = session.query(Review).filter_by(
        product_id=product_id, is_approved=True
    ).order_by(Review.created_at.desc()).limit(20).all()

    stats = session.query(
        func.avg(Review.rating).label('avg'),
        func.count(Review.id).label('cnt'),
    ).filter_by(product_id=product_id, is_approved=True).first()

    data["reviews"] = [r.to_dict() for r in reviews]
    data["avg_rating"] = round(float(stats.avg), 1) if stats and stats.avg else 0
    data["review_count"] = stats.cnt if stats and stats.cnt else 0

    return success_response(data=data)


@products_bp.route('/slug/<slug>', methods=['GET'])
def get_product_by_slug(slug):
    """Get product by slug."""
    session = MySQLSession()
    product = session.query(Product).filter_by(slug=slug, is_active=True).first()
    if not product:
        return error_response("Product not found", 404)
    return get_product(product.id)
