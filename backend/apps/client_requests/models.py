from django.db import models
from django.conf import settings


class ClientRequest(models.Model):
    """
    Client Construction Request model matching Flask client_requests table schema.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=200)
    site_address = models.CharField(max_length=500)
    amount = models.CharField(max_length=100)
    building_type = models.CharField(max_length=100)
    required_details = models.TextField(blank=True, default='')

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='submitted_requests'
    )
    target_user_id = models.IntegerField(null=True, blank=True)
    target_role = models.CharField(max_length=50, default='contractor')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(null=True, blank=True)
    assigned_engineer_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'client_requests'
        ordering = ['-id']

    def __str__(self):
        return f"Request {self.id}: {self.name} ({self.building_type})"
