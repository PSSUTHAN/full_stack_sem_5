from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'name', 'phone', 'specialization', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.Serializer):
    """Handles user registration matching Flask /register endpoint."""
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    role = serializers.CharField(default='client')

    def validate_role(self, value):
        # Normalize role aliases
        if value == 'builder':
            value = 'contractor'
        allowed = ['client', 'contractor', 'site_engineer']
        if value not in allowed:
            value = 'client'
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Email already exists")
        return value.lower()

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'client')
        )


class LoginSerializer(serializers.Serializer):
    """Handles login matching Flask /login endpoint. Supports email or username prefix."""
    email = serializers.CharField(required=False, default='')
    username = serializers.CharField(required=False, default='')
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, default='')

    def validate(self, attrs):
        identifier = (attrs.get('email') or attrs.get('username') or '').strip()
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError("Username/Email and password are required")

        # Try exact email match first, then prefix match (e.g. 'engineer' → 'engineer@...')
        user = None
        try:
            user = User.objects.get(email=identifier)
        except User.DoesNotExist:
            # Try prefix match: 'engineer' matches 'engineer@engineersveedu.com'
            matches = User.objects.filter(email__startswith=f"{identifier}@")
            if matches.exists():
                user = matches.first()

        if user and user.check_password(password):
            if not user.is_active:
                raise serializers.ValidationError("Account is inactive")
            attrs['user'] = user
            return attrs

        raise serializers.ValidationError("Invalid email or password")


class EngineerCreateSerializer(serializers.Serializer):
    """Contractor creates a site engineer account."""
    email = serializers.EmailField()
    name = serializers.CharField(required=False, default='')
    password = serializers.CharField(default='password123')
    phone = serializers.CharField(required=False, default='')
    specialization = serializers.CharField(
        required=False,
        default='Civil Site QA & Supervision'
    )

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError(
                f"An account with email '{value}' already exists"
            )
        return value.lower()


class UserByRoleSerializer(serializers.ModelSerializer):
    """Minimal user serializer for role-based dropdown lists."""
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'name', 'phone', 'specialization', 'contractor_id']


class EngineerWithProjectsSerializer(serializers.ModelSerializer):
    """Site engineer with their assigned projects."""
    projects = serializers.SerializerMethodField()
    active_projects_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'role', 'name', 'phone',
            'specialization', 'status', 'contractor_id',
            'projects', 'active_projects_count', 'created_at'
        ]

    def get_projects(self, obj):
        from apps.projects.models import Project
        projs = Project.objects.filter(site_engineer=obj).values(
            'id', 'name', 'location', 'stage', 'progress',
            'status', 'budget', 'target_date', 'start_date'
        )
        return list(projs)

    def get_active_projects_count(self, obj):
        from apps.projects.models import Project
        return Project.objects.filter(site_engineer=obj).count()
