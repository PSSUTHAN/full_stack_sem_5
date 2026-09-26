from django.contrib import admin
from django.urls import path, include, re_path
from .views import HealthCheckView, FileUploadView, serve_upload

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health', HealthCheckView.as_view(), name='health-check'),
    path('api/upload', FileUploadView.as_view(), name='file-upload'),
    re_path(r'^uploads/(?P<filename>.+)$', serve_upload, name='serve-upload'),

    # App route includes
    path('', include('apps.accounts.urls')),
    path('', include('apps.projects.urls')),
    path('', include('apps.daily_logs.urls')),
    path('', include('apps.client_requests.urls')),
    path('', include('apps.ai_analysis.urls')),
    path('', include('apps.chatbot.urls')),
]
