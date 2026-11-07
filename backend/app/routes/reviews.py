"""Review routes — CRUD for product reviews and ratings (stored in MySQL)."""
from flask import Blueprint, request, g
from sqlalchemy import func

from ..config.database import MySQLSession
from ..models.mysql_models import Review, Product, User
from ..utils.helpers import success_response, error_response
from ..utils.decorators import token_required

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')


@reviews_bp.route('/product/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    session = MySQLSession()
    reviews = session.query(Review).filter_by(
        product_id=product_id, is_approved=True
    ).order_by(Review.created_at.desc()).all()

    stats = session.query(
        func.avg(Review.rating).label('avg'),
        func.count(Review.id).label('cnt'),
    ).filter_by(product_id=product_id, is_approved=True).first()

    result = [r.to_dict() for r in reviews]

    return success_response(data={
        "reviews": result,
        "avg_rating": round(float(stats.avg), 1) if stats and stats.avg else 0,
        "review_count": stats.cnt if stats and stats.cnt else 0,
    })


@reviews_bp.route('/product/<int:product_id>', methods=['POST'])
@token_required
def create_review(product_id):
    data = request.get_json() or {}
    rating = data.get('rating')
    if not rating or not (1 <= int(rating) <= 5):
        return error_response("Rating must be between 1 and 5", 400)

    session = MySQLSession()
    product = session.query(Product).filter_by(id=product_id).first()
    if not product:
        return error_response("Product not found", 404)

    existing = session.query(Review).filter_by(
        product_id=product_id, user_id=g.current_user.id
    ).first()
    if existing:
        return error_response("You already reviewed this product", 409)

    review = Review(
        product_id=product_id,
        user_id=g.current_user.id,
        rating=int(rating),
        title=data.get('title', '').strip(),
        body=data.get('body', '').strip(),
        is_verified=True,
        is_approved=True,
    )
    session.add(review)
    session.commit()

    return success_response(data=review.to_dict(), message="Review submitted successfully", status=201)
