"""Entry point for the ShopVerse Flask application."""
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from backend directory before initializing Flask app
_env_path = Path(__file__).resolve().parent / '.env'
if _env_path.is_file():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
