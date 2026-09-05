import sys
import os

# Set root directory in sys.path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Ensure .env is loaded when running under Passenger
env_path = os.path.join(ROOT_DIR, '.env')
if os.path.exists(env_path):
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except ImportError:
        pass

# Adapt ASGI (FastAPI) to WSGI (Passenger)
from a2wsgi import ASGIMiddleware
from app.main import app

application = ASGIMiddleware(app)
