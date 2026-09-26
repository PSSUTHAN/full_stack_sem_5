from django.urls import path
from .views import ClientRequestListCreateView, ClientRequestStatusUpdateView

urlpatterns = [
    path('api/client-requests', ClientRequestListCreateView.as_view(), name='client-requests-list-create'),
    path('api/client-requests/<int:req_id>/status', ClientRequestStatusUpdateView.as_view(), name='client-requests-status-update'),
]
