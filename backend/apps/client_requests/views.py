from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import ClientRequest
from .serializers import ClientRequestSerializer


class ClientRequestListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Get client construction requests with optional filtering by role and user_id."""
        role = request.query_params.get('role')
        user_id = request.query_params.get('user_id')

        queryset = ClientRequest.objects.all()

        if user_id and user_id != 'demo-user':
            try:
                uid = int(user_id)
                queryset = queryset.filter(Q(client_id=uid) | Q(target_user_id=uid))
            except ValueError:
                pass

        if role:
            queryset = queryset.filter(target_role=role)

        queryset = queryset.order_by('-id')
        serializer = ClientRequestSerializer(queryset, many=True)
        return Response({"requests": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new client request."""
        data = request.data or {}
        name = data.get('name', '').strip()
        site_address = (data.get('site_address') or data.get('siteAddress', '')).strip()
        amount = data.get('amount', '').strip()
        building_type = (data.get('building_type') or data.get('buildingType', '')).strip()
        required_details = (data.get('required_details') or data.get('requiredDetails') or data.get('siteDetails', '')).strip()

        if not name or not site_address or not amount or not building_type:
            return Response(
                {"error": "Name, site address, amount, and building type are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        client_id = data.get('client_id')
        target_user_id = data.get('target_user_id') or data.get('engineerId')
        target_role = data.get('target_role') or data.get('engineerRole', 'contractor')

        try:
            target_user_id = int(target_user_id) if target_user_id else None
        except (ValueError, TypeError):
            target_user_id = None

        try:
            client_id = int(client_id) if client_id else None
        except (ValueError, TypeError):
            client_id = None

        new_req = ClientRequest.objects.create(
            name=name,
            site_address=site_address,
            amount=amount,
            building_type=building_type,
            required_details=required_details,
            client_id=client_id,
            target_user_id=target_user_id,
            target_role=target_role,
            status='pending'
        )

        serializer = ClientRequestSerializer(new_req)
        return Response({
            "message": "Client request submitted successfully",
            "request_id": new_req.id,
            "request": serializer.data
        }, status=status.HTTP_201_CREATED)


class ClientRequestStatusUpdateView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, req_id):
        """Update status of a client request along with rejection_reason or assigned_engineer_id."""
        try:
            req_obj = ClientRequest.objects.get(id=req_id)
        except ClientRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user and request.user.is_authenticated and not request.user.is_staff:
            if request.user.role == 'client' and req_obj.target_user_id != request.user.id:
                return Response(
                    {"error": "Forbidden: Clients cannot modify status of requests."},
                    status=status.HTTP_403_FORBIDDEN
                )

        data = request.data or {}
        new_status = data.get('status', 'accepted')
        rejection_reason = data.get('rejection_reason') or data.get('rejectionReason')
        assigned_engineer_id = data.get('assigned_engineer_id') or data.get('assignedEngineerId')

        req_obj.status = new_status
        if rejection_reason is not None:
            req_obj.rejection_reason = rejection_reason
        if assigned_engineer_id is not None:
            try:
                req_obj.assigned_engineer_id = int(assigned_engineer_id)
            except (ValueError, TypeError):
                pass
        req_obj.save()

        return Response({
            "message": f"Request status updated to {new_status}",
            "id": req_id,
            "status": new_status,
            "rejection_reason": req_obj.rejection_reason,
            "assigned_engineer_id": req_obj.assigned_engineer_id
        }, status=status.HTTP_200_OK)
