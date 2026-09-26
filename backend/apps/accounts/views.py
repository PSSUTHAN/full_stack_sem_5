from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    EngineerCreateSerializer,
    EngineerWithProjectsSerializer,
)


def get_tokens_for_user(user):
    """Generate JWT access + refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    """
    POST /register
    Body: { email, password, role }
    Matches Flask /register endpoint.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully", "role": serializer.validated_data['role']},
                status=status.HTTP_201_CREATED
            )
        # Flatten errors
        errors = serializer.errors
        error_msg = next(iter(errors.values()))[0] if errors else "Registration failed"
        return Response({"error": str(error_msg)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /login
    Body: { email/username, password, role }
    Returns: { message, user: { id, email, role }, token }
    Matches Flask /login endpoint exactly.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            requested_role = request.data.get('role')
            if requested_role and requested_role in ['client', 'contractor', 'site_engineer', 'builder']:
                target_role = 'contractor' if requested_role == 'builder' else requested_role
                if user.role != target_role:
                    user.role = target_role
                    user.save(update_fields=['role'])

            tokens = get_tokens_for_user(user)
            role = 'contractor' if user.role == 'builder' else user.role
            return Response({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": role,
                    "name": user.name or user.email.split('@')[0],
                },
                # Provide both real JWT token and backwards-compat field name
                "token": tokens['access'],
                "access": tokens['access'],
                "refresh": tokens['refresh'],
            }, status=status.HTTP_200_OK)

        errors = serializer.errors
        error_msg = (
            errors.get('non_field_errors', ['Invalid email or password'])[0]
            if 'non_field_errors' in errors
            else "Invalid email or password"
        )
        return Response({"error": str(error_msg)}, status=status.HTTP_401_UNAUTHORIZED)


class ProfileView(APIView):
    """
    GET /profile
    Returns current authenticated user's profile.
    Also supports ?email= query param for backward compatibility.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # JWT auth
        if request.user and request.user.is_authenticated:
            user = request.user
        else:
            # Backward compat: ?email= query param
            email = request.query_params.get('email')
            if not email:
                return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        role = 'contractor' if user.role == 'builder' else user.role
        return Response({
            "id": user.id,
            "email": user.email,
            "role": role,
            "name": user.name or user.email.split('@')[0],
            "username": user.email.split('@')[0],
            "phone": user.phone,
            "specialization": user.specialization,
            "status": user.status,
        })


class UsersByRoleView(APIView):
    """
    GET /api/users/by-role?role=client|contractor|site_engineer
    Returns list of users filtered by role for project assignment dropdowns.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        target_role = request.query_params.get('role')
        queryset = User.objects.all()

        if target_role:
            # Normalize builder to contractor
            if target_role == 'contractor':
                queryset = queryset.filter(role__in=['contractor', 'builder'])
            else:
                queryset = queryset.filter(role=target_role)

        queryset = queryset.order_by('id')
        users = []
        for u in queryset:
            role = 'contractor' if u.role == 'builder' else u.role
            users.append({
                'id': u.id,
                'email': u.email,
                'role': role,
                'name': u.name if u.name else u.email.split('@')[0],
                'phone': u.phone,
                'specialization': u.specialization,
                'contractor_id': u.contractor_id,
            })

        return Response({"users": users})


class ContractorEngineersView(APIView):
    """
    GET /api/contractors/<contractor_id>/engineers
    POST /api/contractors/<contractor_id>/engineers
    Manage site engineers under a contractor.
    """
    permission_classes = [AllowAny]

    def get(self, request, contractor_id):
        engineers = User.objects.filter(
            role='site_engineer'
        ).filter(
            contractor_id=contractor_id
        ).exclude(status='inactive').order_by('id')

        data = []
        for eng in engineers:
            serializer = EngineerWithProjectsSerializer(eng)
            eng_data = serializer.data
            if not eng_data.get('name'):
                eng_data['name'] = eng.email.split('@')[0].capitalize() + ' (Site Engineer)'
            if not eng_data.get('specialization'):
                eng_data['specialization'] = 'Civil Site QA & Supervision'
            data.append(eng_data)

        return Response({"engineers": data})

    def post(self, request, contractor_id):
        if request.user and request.user.is_authenticated:
            if not request.user.is_staff and str(request.user.id) != str(contractor_id):
                return Response(
                    {"error": "Unauthorized: Cannot create engineers for another contractor."},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = EngineerCreateSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            error_msg = next(iter(errors.values()))[0] if errors else "Validation failed"
            return Response({"error": str(error_msg)}, status=status.HTTP_400_BAD_REQUEST)

        vd = serializer.validated_data
        email = vd['email']
        name = vd['name'] or (email.split('@')[0].capitalize() + ' (Site Engineer)')

        try:
            contractor = User.objects.get(id=contractor_id)
        except User.DoesNotExist:
            return Response({"error": "Contractor not found"}, status=status.HTTP_404_NOT_FOUND)

        engineer = User.objects.create_user(
            email=email,
            password=vd['password'],
            role='site_engineer',
            name=name,
            phone=vd.get('phone', ''),
            specialization=vd.get('specialization', 'Civil Site QA & Supervision'),
            status='active',
            contractor=contractor,
        )

        return Response({
            "message": "Site engineer created successfully",
            "engineer": {
                "id": engineer.id,
                "email": engineer.email,
                "name": engineer.name,
                "phone": engineer.phone,
                "specialization": engineer.specialization,
                "contractor_id": contractor_id,
                "projects": [],
                "active_projects_count": 0,
            }
        }, status=status.HTTP_201_CREATED)


class ContractorEngineerDetailView(APIView):
    """
    DELETE /api/contractors/<contractor_id>/engineers/<engineer_id>
    Remove a site engineer and unassign their projects.
    """
    permission_classes = [AllowAny]

    def delete(self, request, contractor_id, engineer_id):
        if request.user and request.user.is_authenticated:
            if not request.user.is_staff and str(request.user.id) != str(contractor_id):
                return Response(
                    {"error": "Unauthorized: Cannot delete engineers of another contractor."},
                    status=status.HTTP_403_FORBIDDEN
                )

        try:
            engineer = User.objects.get(id=engineer_id, role='site_engineer')
        except User.DoesNotExist:
            return Response({"error": "Site engineer not found"}, status=status.HTTP_404_NOT_FOUND)

        # Unassign their projects
        from apps.projects.models import Project
        Project.objects.filter(site_engineer=engineer).update(site_engineer=None)

        email = engineer.email
        engineer.delete()

        return Response({"message": f"Site engineer '{email}' removed successfully"})
