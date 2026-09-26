import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from apps.projects.models import Project
from .models import DailyLog
from .serializers import DailyLogSerializer


class DailyLogListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, project_id):
        """Get chronological day-by-day logs for a project with full engineering details."""
        logs = DailyLog.objects.filter(project_id=project_id).select_related('logged_by').order_by('-date', '-id')
        serializer = DailyLogSerializer(logs, many=True)
        return Response({
            "logs": serializer.data,
            "count": len(serializer.data)
        }, status=status.HTTP_200_OK)

    def post(self, request, project_id):
        """
        Site engineer or contractor submits a daily site update with granular engineering details:
        labor breakdown, material inventory, sub-task checklists, QA/QC tests, and inspection remarks.
        """
        data = request.data or {}
        work_completed = data.get('work_completed', '').strip()
        if not work_completed:
            return Response({"error": "Work completed description is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user and request.user.is_authenticated and not request.user.is_staff:
            uid = request.user.id
            if uid not in (project.contractor_id, project.site_engineer_id):
                return Response(
                    {"error": "Forbidden: Only assigned contractors or site engineers can post daily logs."},
                    status=status.HTTP_403_FORBIDDEN
                )

        log_date = data.get('date') or datetime.date.today().strftime('%Y-%m-%d')
        stage = data.get('stage', 'General Construction')
        try:
            progress_added = int(data.get('progress_added', 0))
        except (ValueError, TypeError):
            progress_added = 0
        try:
            labor_count = int(data.get('labor_count', 0))
        except (ValueError, TypeError):
            labor_count = 0
        materials_used = data.get('materials_used', 'As per standard BOM')
        weather = data.get('weather', 'Clear / Sunny')
        issues_delay = data.get('issues_delay', 'None')
        site_photos = data.get('site_photos', '')
        logged_by_id = data.get('logged_by')

        # Detailed tracking fields
        sub_tasks = data.get('sub_tasks', [])
        labor_breakdown = data.get('labor_breakdown', {})
        materials_breakdown = data.get('materials_breakdown', {})
        quality_checks = data.get('quality_checks', {})
        inspection_status = data.get('inspection_status', 'Verified')

        log = DailyLog.objects.create(
            project=project,
            date=log_date,
            stage=stage,
            work_completed=work_completed,
            progress_added=progress_added,
            labor_count=labor_count,
            materials_used=materials_used,
            weather=weather,
            issues_delay=issues_delay,
            site_photos=site_photos,
            sub_tasks=sub_tasks if isinstance(sub_tasks, list) else [],
            labor_breakdown=labor_breakdown if isinstance(labor_breakdown, dict) else {},
            materials_breakdown=materials_breakdown if isinstance(materials_breakdown, dict) else {},
            quality_checks=quality_checks if isinstance(quality_checks, dict) else {},
            inspection_status=inspection_status,
            logged_by_id=logged_by_id if logged_by_id else None
        )

        # Update project progress & stage if specified
        if progress_added > 0 or stage:
            if progress_added > 0:
                new_progress = min(100, project.progress + progress_added)
            else:
                new_progress = project.progress

            # Explicit progress override if provided in payload
            if 'total_progress' in data and data['total_progress'] is not None:
                try:
                    new_progress = int(data['total_progress'])
                except (ValueError, TypeError):
                    pass

            project.progress = new_progress
            if stage:
                project.stage = stage
            if new_progress >= 100:
                project.status = 'Completed'
            project.save()

        return Response({
            "message": "Daily log recorded successfully",
            "log_id": log.id
        }, status=status.HTTP_201_CREATED)


class DailyLogDetailView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, project_id, log_id):
        """Delete a daily log entry."""
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user and request.user.is_authenticated and not request.user.is_staff:
            uid = request.user.id
            if uid not in (project.contractor_id, project.site_engineer_id):
                return Response(
                    {"error": "Forbidden: Only assigned contractors or site engineers can delete logs."},
                    status=status.HTTP_403_FORBIDDEN
                )

        deleted_count, _ = DailyLog.objects.filter(id=log_id, project_id=project_id).delete()
        if deleted_count == 0:
            return Response({"error": "Log not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Log deleted successfully"}, status=status.HTTP_200_OK)
