from django.urls import path
from health.views import hello, health, liveness, readiness
from api.views import auth_me, auth_logout, auth_api_key, dev_token, users_items, users_item_detail

urlpatterns = [
    path('', hello, name='hello'),
    path('health/', health, name='health'),
    path('health/live', liveness, name='liveness'),
    path('health/ready', readiness, name='readiness'),
    # ── Auth routes ────────────────────────────────────────────────────────
    path('auth/me', auth_me, name='auth_me'),
    path('auth/logout', auth_logout, name='auth_logout'),
    path('auth/api-key', auth_api_key, name='auth_api_key'),
    path('dev/token', dev_token, name='dev_token'),
    # ── Users routes ───────────────────────────────────────────────────────
    path('users/me/items', users_items, name='users_items'),
    path('users/me/items/<int:item_id>', users_item_detail, name='users_item_detail'),
]
