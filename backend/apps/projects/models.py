from django.db import models
from django.conf import settings


class Project(models.Model):
    """
    Construction project model matching Flask projects table schema.
    """
    STATUS_CHOICES = [
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('On Hold', 'On Hold'),
        ('Planning', 'Planning'),
    ]

    name = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    location = models.CharField(max_length=500)
    budget = models.CharField(max_length=100, blank=True, default='₹50,00,000')
    start_date = models.CharField(max_length=20, blank=True, default='')
    target_date = models.CharField(max_length=20, blank=True, default='')
    stage = models.CharField(max_length=300, blank=True, default='Planning')
    progress = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default='In Progress')
    created_at = models.DateTimeField(auto_now_add=True)

    # User relationships
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='client_projects'
    )
    contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='contractor_projects'
    )
    site_engineer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='engineer_projects'
    )

    class Meta:
        db_table = 'projects'
        ordering = ['-id']

    def __str__(self):
        return str(self.name or f"Project #{self.id}")
