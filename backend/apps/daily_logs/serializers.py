from rest_framework import serializers
from .models import DailyLog


class DailyLogSerializer(serializers.ModelSerializer):
    logged_by_email = serializers.SerializerMethodField()
    logged_by_role = serializers.SerializerMethodField()

    class Meta:
        model = DailyLog
        fields = [
            'id',
            'project_id',
            'date',
            'stage',
            'work_completed',
            'progress_added',
            'labor_count',
            'materials_used',
            'weather',
            'issues_delay',
            'site_photos',
            'sub_tasks',
            'labor_breakdown',
            'materials_breakdown',
            'quality_checks',
            'inspection_status',
            'logged_by',
            'logged_by_email',
            'logged_by_role',
            'created_at',
        ]

    def get_logged_by_email(self, obj):
        return obj.logged_by.email if obj.logged_by else None

    def get_logged_by_role(self, obj):
        return obj.logged_by.role if obj.logged_by else None
