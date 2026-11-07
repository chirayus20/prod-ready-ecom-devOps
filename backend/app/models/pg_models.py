"""
PostgreSQL models deprecated. All models have been migrated to MySQL (mysql_models.py).
Re-exporting from mysql_models for backward compatibility.
"""
from .mysql_models import (
    PaymentTransaction,
    ShipmentTracking,
    Review,
    ReturnRefund,
)
