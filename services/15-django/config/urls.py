from django.urls import path
from health.views import hello, health, liveness, readiness

urlpatterns = [
    path('', hello, name='hello'),
    path('health/', health, name='health'),
    path('health/live', liveness, name='liveness'),
    path('health/ready', readiness, name='readiness'),
]
