import django
from django.conf import settings

def pytest_configure():
    settings.configure(
        DATABASES={},
        INSTALLED_APPS=['django.contrib.contenttypes','django.contrib.auth','health','api'],
        ROOT_URLCONF='config.urls',
        MIDDLEWARE=['django.middleware.common.CommonMiddleware'],
        SECRET_KEY='test-only-key',
        ALLOWED_HOSTS=['*'],
    )
