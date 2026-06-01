from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-only-insecure-key')
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'health',
    'api',
]

MIDDLEWARE = ['django.middleware.common.CommonMiddleware']

ROOT_URLCONF = 'config.urls'

DATABASES = {}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
