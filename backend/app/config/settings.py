"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Search candidates: backend/.env, repo root .env, or current working directory
_config_dir = Path(__file__).resolve().parent
_candidates = [
    _config_dir.parent.parent / '.env',          # backend/.env
    _config_dir.parent.parent.parent / '.env',   # repo-root/.env
    Path.cwd() / '.env',
    Path.cwd() / 'backend' / '.env',
]
for _candidate in _candidates:
    if _candidate.is_file():
        load_dotenv(dotenv_path=_candidate)
        break
else:
    load_dotenv()


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'true').lower() in ('true', '1', 'yes')

    # ── MySQL (Aiven) ───────────────────────────────────────────────
    # Supports both MYSQL_* (standard) and DB_* (legacy/alternative) variable names
    MYSQL_URL = os.getenv('MYSQL_URL') or os.getenv('DATABASE_URL')
    MYSQL_HOST = os.getenv('MYSQL_HOST') or os.getenv('DB_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT') or os.getenv('DB_PORT', '3306'))
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE') or os.getenv('DB_NAME', 'shopverse')
    MYSQL_USER = os.getenv('MYSQL_USER') or os.getenv('DB_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD') or os.getenv('DB_PASSWORD', '')
    MYSQL_SSL_MODE = os.getenv('MYSQL_SSL_MODE') or os.getenv('DB_SSL_MODE', 'REQUIRED')

    # ── Media Upload & Storage (Local with S3 Preparation) ──────────
    UPLOAD_FOLDER = str(_config_dir.parent.parent / 'uploads' / 'products')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 10 * 1024 * 1024))  # 10MB
    STORAGE_BACKEND = os.getenv('STORAGE_BACKEND', 'local')  # 'local' or 's3'

    # S3 Settings (Prepared for future AWS DevOps deployment)
    AWS_S3_BUCKET_NAME = os.getenv('AWS_S3_BUCKET_NAME', '')
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
