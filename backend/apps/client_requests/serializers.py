from rest_framework import serializers
from .models import ClientRequest


class ClientRequestSerializer(serializers.ModelSerializer):
    client_id = serializers.IntegerField(source='client.id', read_only=True)
    siteAddress = serializers.CharField(source='site_address', read_only=True)
    buildingType = serializers.CharField(source='building_type', read_only=True)
    requiredDetails = serializers.CharField(source='required_details', read_only=True)
    rejectionReason = serializers.CharField(source='rejection_reason', read_only=True)
    assignedEngineerId = serializers.IntegerField(source='assigned_engineer_id', read_only=True)

    class Meta:
        model = ClientRequest
        fields = [
            'id',
            'name',
            'site_address',
            'siteAddress',
            'amount',
            'building_type',
            'buildingType',
            'required_details',
            'requiredDetails',
            'client_id',
            'target_user_id',
            'target_role',
            'status',
            'rejection_reason',
            'rejectionReason',
            'assigned_engineer_id',
            'assignedEngineerId',
            'created_at',
        ]
