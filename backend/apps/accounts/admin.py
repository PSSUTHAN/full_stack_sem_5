from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'name', 'role', 'status', 'contractor', 'created_at')
    list_filter = ('role', 'status')
    search_fields = ('email', 'name', 'phone')
