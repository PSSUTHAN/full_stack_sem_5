from django.urls import path
from .views import DailyLogListCreateView, DailyLogDetailView

urlpatterns = [
    path('api/projects/<int:project_id>/daily-logs', DailyLogListCreateView.as_view(), name='daily-log-list-create'),
    path('api/projects/<int:project_id>/daily-logs/<int:log_id>', DailyLogDetailView.as_view(), name='daily-log-detail'),
]
