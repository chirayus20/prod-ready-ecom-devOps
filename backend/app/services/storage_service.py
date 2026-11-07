"""
Product Image Storage Service.

Provides a pluggable storage interface:
- LocalStorageService: Saves files to local media folder (/media/uploads/...)
- S3StorageService: Pre-configured for Amazon S3 deployment in DevOps phase
"""
import os
import uuid
from abc import ABC, abstractmethod
from werkzeug.utils import secure_filename
from ..config.settings import Config

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}


def is_allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


class StorageService(ABC):
    @abstractmethod
    def save_file(self, file_storage) -> str:
        """Saves an uploaded file and returns its accessible URL."""
        pass


class LocalStorageService(StorageService):
    def __init__(self, upload_folder: str = None):
        self.upload_folder = upload_folder or Config.UPLOAD_FOLDER
        os.makedirs(self.upload_folder, exist_ok=True)

    def save_file(self, file_storage) -> str:
        if not file_storage or not file_storage.filename:
            raise ValueError("No file provided")

        if not is_allowed_file(file_storage.filename):
            raise ValueError(f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

        orig_filename = secure_filename(file_storage.filename)
        ext = orig_filename.rsplit('.', 1)[1].lower() if '.' in orig_filename else 'jpg'
        unique_name = f"{uuid.uuid4().hex[:12]}_{orig_filename}"
        filepath = os.path.join(self.upload_folder, unique_name)

        file_storage.save(filepath)
        # Return web-accessible path
        return f"/media/uploads/{unique_name}"


class S3StorageService(StorageService):
    """
    Amazon S3 Storage implementation for production DevOps deployments.
    Reads credentials from backend environment variables (never sent to client).
    """
    def __init__(self):
        self.bucket = Config.AWS_S3_BUCKET_NAME
        self.region = Config.AWS_REGION

    def save_file(self, file_storage) -> str:
        if not is_allowed_file(file_storage.filename):
            raise ValueError("Invalid file extension")

        try:
            import boto3
            s3 = boto3.client(
                's3',
                region_name=self.region,
                aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
            )
            orig_filename = secure_filename(file_storage.filename)
            unique_name = f"products/{uuid.uuid4().hex[:12]}_{orig_filename}"
            s3.upload_fileobj(
                file_storage,
                self.bucket,
                unique_name,
                ExtraArgs={'ContentType': file_storage.content_type or 'image/jpeg'}
            )
            return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{unique_name}"
        except ImportError:
            raise RuntimeError("boto3 package not installed for S3 upload. Run: pip install boto3")


def get_storage_service() -> StorageService:
    """Returns configured storage backend."""
    if Config.STORAGE_BACKEND == 's3' and Config.AWS_S3_BUCKET_NAME:
        return S3StorageService()
    return LocalStorageService()

