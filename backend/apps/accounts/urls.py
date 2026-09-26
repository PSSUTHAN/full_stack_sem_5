from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    UsersByRoleView,
    ContractorEngineersView,
    ContractorEngineerDetailView,
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('profile', ProfileView.as_view(), name='profile'),
    path('api/users/by-role', UsersByRoleView.as_view(), name='users-by-role'),
    path('api/contractors/<int:contractor_id>/engineers', ContractorEngineersView.as_view(), name='contractor-engineers'),
    path('api/contractors/<int:contractor_id>/engineers/<int:engineer_id>', ContractorEngineerDetailView.as_view(), name='contractor-engineer-detail'),
]
