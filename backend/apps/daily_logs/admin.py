from django.contrib import admin
from .models import DailyLog


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'date', 'stage', 'progress_added', 'labor_count', 'logged_by', 'created_at')
    list_filter = ('stage', 'inspection_status')
    search_fields = ('work_completed', 'materials_used')
