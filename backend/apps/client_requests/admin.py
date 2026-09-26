from django.contrib import admin
from .models import ClientRequest


@admin.register(ClientRequest)
class ClientRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'building_type', 'amount', 'status', 'client', 'target_role', 'created_at')
    list_filter = ('status', 'target_role', 'building_type')
    search_fields = ('name', 'site_address')
