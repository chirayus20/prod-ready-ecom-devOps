"""Health-check endpoint for monitoring system status."""
from flask import Blueprint
from ..config.database import check_mysql
from ..utils.helpers import success_response

health_bp = Blueprint('health', __name__, url_prefix='/api/health')


@health_bp.route('', methods=['GET'])
def health_check():
    mysql_ok, mysql_msg = check_mysql()

    status = "healthy" if mysql_ok else "unhealthy"
    code = 200 if mysql_ok else 503

    return success_response(
        data={
            "database": {
                "engine": "MySQL (Aiven Cloud)",
                "status": "healthy" if mysql_ok else "unhealthy",
                "detail": mysql_msg,
            }
        },
        message="All systems operational" if mysql_ok else "Database unreachable",
        status=code,
    )
