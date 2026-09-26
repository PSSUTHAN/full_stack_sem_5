from django.db import models
from django.conf import settings
from apps.projects.models import Project


class DailyLog(models.Model):
    """
    Daily Process Log model matching Flask daily_logs table schema.
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='daily_logs'
    )
    date = models.CharField(max_length=20)
    stage = models.CharField(max_length=100, default='General Construction')
    work_completed = models.TextField()
    progress_added = models.IntegerField(default=0)
    labor_count = models.IntegerField(default=0)
    materials_used = models.TextField(blank=True, default='As per standard BOM')
    weather = models.CharField(max_length=100, default='Clear / Sunny')
    issues_delay = models.TextField(blank=True, default='None')
    site_photos = models.TextField(blank=True, default='')

    # Granular engineering data
    sub_tasks = models.JSONField(default=list, blank=True)
    labor_breakdown = models.JSONField(default=dict, blank=True)
    materials_breakdown = models.JSONField(default=dict, blank=True)
    quality_checks = models.JSONField(default=dict, blank=True)
    inspection_status = models.CharField(max_length=50, default='Verified')

    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='logged_daily_logs'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_logs'
        ordering = ['-date', '-id']

    def __str__(self):
        return f"Log {self.id} for Project {self.project_id} on {self.date}"
