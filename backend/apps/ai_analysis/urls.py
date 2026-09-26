from django.urls import path
from .views import ProjectAnalysisView

urlpatterns = [
    path('api/projects/<int:project_id>/analysis', ProjectAnalysisView.as_view(), name='project-analysis'),
]
