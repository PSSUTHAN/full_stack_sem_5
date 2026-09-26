from django.urls import path
from .views import ProjectListCreateView, ProjectDetailView, ProjectComponentsView

urlpatterns = [
    path('api/projects', ProjectListCreateView.as_view(), name='project-list-create'),
    path('api/projects/<int:project_id>', ProjectDetailView.as_view(), name='project-detail'),
    path('api/projects/<int:project_id>/components', ProjectComponentsView.as_view(), name='project-components'),
]
