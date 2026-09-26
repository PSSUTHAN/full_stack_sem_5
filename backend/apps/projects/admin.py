from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location', 'stage', 'progress', 'status', 'client', 'contractor', 'site_engineer')
    list_filter = ('status', 'stage')
    search_fields = ('name', 'location')
