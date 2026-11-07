"""
Single-database engine and session management.
Exclusively manages the Aiven MySQL database connection.
"""
from sqlalchemy import create_engine, URL, text
from sqlalchemy.orm import sessionmaker, scoped_session
from .settings import Config

cfg = Config

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MySQL Engine  (Aiven Cloud MySQL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_mysql_connect_args: dict = {}
if cfg.MYSQL_SSL_MODE and cfg.MYSQL_SSL_MODE.upper() != 'DISABLED':
    _mysql_connect_args['ssl'] = {'ssl_mode': cfg.MYSQL_SSL_MODE}

if cfg.MYSQL_URL:
    _mysql_url = cfg.MYSQL_URL
else:
    _mysql_url = URL.create(
        drivername="mysql+pymysql",
        username=cfg.MYSQL_USER,
        password=cfg.MYSQL_PASSWORD,
        host=cfg.MYSQL_HOST,
        port=cfg.MYSQL_PORT,
        database=cfg.MYSQL_DATABASE,
    )

mysql_engine = create_engine(
    _mysql_url,
    connect_args=_mysql_connect_args,
    pool_recycle=280,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
)

MySQLSession = scoped_session(sessionmaker(bind=mysql_engine))

# Alias PGSession to MySQLSession for any legacy references
PGSession = MySQLSession
pg_engine = mysql_engine


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Health-check helpers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def check_mysql():
    """Return True if MySQL is reachable."""
    try:
        with mysql_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, "connected"
    except Exception as e:
        return False, str(e)


def check_postgres():
    """Deprecated: redirects to MySQL health check."""
    return check_mysql()
