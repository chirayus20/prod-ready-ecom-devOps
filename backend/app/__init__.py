"""ShopVerse Flask application factory."""
import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# Robust fallback to ensure .env is loaded whenever create_app() is imported directly
_env_path = Path(__file__).resolve().parent.parent / '.env'
if _env_path.is_file():
    load_dotenv(dotenv_path=_env_path)


def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.settings.Config')

    # ── CORS ───────────────────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": "*"}, r"/media/*": {"origins": "*"}})

    # ── Ensure Upload Directory Exists ─────────────────────────────
    upload_folder = app.config.get('UPLOAD_FOLDER')
    if upload_folder:
        os.makedirs(upload_folder, exist_ok=True)

    # ── Media Static Serving Route ─────────────────────────────────
    @app.route('/media/uploads/<path:filename>')
    def serve_uploaded_media(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # ── Database table creation (MySQL only) ───────────────────────
    from .config.database import mysql_engine, MySQLSession
    from .models.mysql_models import MySQLBase

    try:
        MySQLBase.metadata.create_all(mysql_engine)
        print("✓ MySQL tables verified / created.")
    except Exception as e:
        print(f"✗ MySQL table creation skipped: {e}")

    # ── Session teardown ───────────────────────────────────────────
    @app.teardown_appcontext
    def shutdown_sessions(exception=None):
        MySQLSession.remove()

    # ── Register blueprints ────────────────────────────────────────
    from .routes.health import health_bp
    from .routes.auth import auth_bp
    from .routes.products import products_bp
    from .routes.categories import categories_bp
    from .routes.cart import cart_bp
    from .routes.wishlist import wishlist_bp
    from .routes.orders import orders_bp
    from .routes.payments import payments_bp
    from .routes.reviews import reviews_bp
    from .routes.returns import returns_bp
    from .routes.admin import admin_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(returns_bp)
    app.register_blueprint(admin_bp)

    # ── Global error handlers ─────────────────────────────────────
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "message": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app
