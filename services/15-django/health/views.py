from django.http import JsonResponse

def hello(request):
    return JsonResponse({"message": "Hello from Django 5.2", "framework": "15-django", "version": "1.0.0"})

def health(request):
    return JsonResponse({"status": "ok", "version": "1.0.0"})

def liveness(request):
    return JsonResponse({"status": "ok"})

def readiness(request):
    return JsonResponse({"status": "ok"})
