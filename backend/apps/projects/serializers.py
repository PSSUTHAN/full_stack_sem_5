from rest_framework import serializers
from .models import Project


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Project serializer with joined user email fields,
    matching Flask's SELECT with LEFT JOINs.
    """
    client_email = serializers.SerializerMethodField()
    contractor_email = serializers.SerializerMethodField()
    site_engineer_email = serializers.SerializerMethodField()
    total_logs = serializers.SerializerMethodField()
    last_log_date = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'location',
            'budget', 'start_date', 'target_date',
            'stage', 'progress', 'status', 'created_at',
            'client_id', 'contractor_id', 'site_engineer_id',
            'client_email', 'contractor_email', 'site_engineer_email',
            'total_logs', 'last_log_date',
        ]

    def get_client_email(self, obj):
        return obj.client.email if obj.client else None

    def get_contractor_email(self, obj):
        return obj.contractor.email if obj.contractor else None

    def get_site_engineer_email(self, obj):
        return obj.site_engineer.email if obj.site_engineer else None

    def get_total_logs(self, obj):
        return obj.daily_logs.count()

    def get_last_log_date(self, obj):
        last = obj.daily_logs.order_by('-date', '-id').first()
        return last.date if last else None


class ProjectDetailSerializer(ProjectListSerializer):
    """Same as list but with total_logs count."""


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Handles project creation with integer FK IDs."""
    class Meta:
        model = Project
        fields = [
            'name', 'description', 'location',
            'budget', 'start_date', 'target_date',
            'stage', 'progress', 'status',
            'client', 'contractor', 'site_engineer',
        ]

    def validate_progress(self, value):
        if value is None:
            return 0
        return int(value)
