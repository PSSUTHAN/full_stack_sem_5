import os
import json
import datetime
import google.generativeai as genai
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from apps.projects.models import Project
from apps.daily_logs.models import DailyLog


class ProjectAnalysisView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, project_id):
        """
        Comprehensive Project Efficiency & Health Analysis.
        Calculates schedule velocity, completion forecast, labor productivity,
        and queries Gemini AI (or algorithmic heuristics) for actionable efficiency optimizations.
        """
        try:
            project = Project.objects.select_related('client', 'contractor', 'site_engineer').get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        logs_qs = DailyLog.objects.filter(project_id=project_id).order_by('date', 'id')
        logs = [
            {
                'id': log_entry.id,
                'date': log_entry.date,
                'stage': log_entry.stage,
                'work_completed': log_entry.work_completed,
                'labor_count': log_entry.labor_count,
                'issues_delay': log_entry.issues_delay,
            }
            for log_entry in logs_qs
        ]

        total_logs = len(logs)
        current_progress = project.progress or 0
        total_labor = sum(item.get('labor_count', 0) for item in logs)
        avg_labor = round(total_labor / total_logs, 1) if total_logs > 0 else 0

        # Dates & Pace
        today = datetime.date.today()
        try:
            start_d = datetime.datetime.strptime(project.start_date or '2026-09-01', '%Y-%m-%d').date()
        except (ValueError, TypeError):
            start_d = today - datetime.timedelta(days=20)

        try:
            target_d = datetime.datetime.strptime(project.target_date or '2026-12-30', '%Y-%m-%d').date()
        except (ValueError, TypeError):
            target_d = today + datetime.timedelta(days=90)

        days_elapsed = max(1, (today - start_d).days)
        days_total = max(1, (target_d - start_d).days)
        days_remaining = max(1, (target_d - today).days)

        actual_pace = round(current_progress / days_elapsed, 2)
        planned_pace = round(100.0 / days_total, 2)
        required_pace = round((100.0 - current_progress) / days_remaining, 2) if days_remaining > 0 else actual_pace

        # Projected completion
        if actual_pace > 0:
            days_to_complete = int((100 - current_progress) / actual_pace)
            projected_completion_date = (today + datetime.timedelta(days=days_to_complete)).strftime('%Y-%m-%d')
        else:
            projected_completion_date = target_d.strftime('%Y-%m-%d')

        # Schedule Variance & Status
        pace_ratio = actual_pace / (planned_pace if planned_pace > 0 else 1)
        if pace_ratio >= 1.05:
            schedule_status = "Ahead of Schedule"
            status_color = "emerald"
        elif pace_ratio >= 0.90:
            schedule_status = "On Track"
            status_color = "blue"
        else:
            schedule_status = "Delayed / At Risk"
            status_color = "amber"

        # Active issues
        active_issues = [
            {"date": log_item['date'], "stage": log_item['stage'], "issue": log_item['issues_delay']}
            for log_item in logs if log_item.get('issues_delay') and log_item['issues_delay'].lower() not in ['none', 'nil', 'no issues', '']
        ]

        # Efficiency Score Computation (0 - 100)
        pace_score = min(40, max(10, int(pace_ratio * 35)))
        logging_score = min(25, total_logs * 3)
        labor_score = 20 if avg_labor >= 10 else int(avg_labor * 2)
        blocker_penalty = min(15, len(active_issues) * 3)
        blocker_score = max(0, 15 - blocker_penalty)
        efficiency_score = min(98, max(45, pace_score + logging_score + labor_score + blocker_score))

        # Construction stages breakdown
        construction_stages = [
            {"name": "Site Preparation & Excavation", "order": 1, "target": 10},
            {"name": "Foundation & Footing", "order": 2, "target": 25},
            {"name": "Plinth & Columns Framing", "order": 3, "target": 45},
            {"name": "Brickwork & Masonry", "order": 4, "target": 65},
            {"name": "Plumbing & Electrical MEP", "order": 5, "target": 80},
            {"name": "Plastering & Tiling", "order": 6, "target": 92},
            {"name": "Painting, Fixtures & Handover", "order": 7, "target": 100}
        ]

        for s in construction_stages:
            if current_progress >= s['target']:
                s['status'] = 'Completed'
                s['stage_pct'] = 100
            elif current_progress > s['target'] - 15:
                s['status'] = 'In Progress'
                s['stage_pct'] = max(15, min(90, int((current_progress - (s['target'] - 15)) / 15 * 100)))
            else:
                s['status'] = 'Upcoming'
                s['stage_pct'] = 0

        # AI Insights with Gemini + Heuristic fallback
        ai_insights = None
        ai_source = "heuristic"

        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if gemini_key:
            try:
                genai.configure(api_key=gemini_key)
                prompt = f"""You are a senior civil construction engineer and project efficiency auditor at Engineers Veedu.
Analyze this construction project and provide a concise, structured JSON assessment:

Project Name: {project.name}
Current Stage: {project.stage}
Overall Progress: {current_progress}%
Budget: {project.budget}
Days Elapsed: {days_elapsed} days
Days Remaining: {days_remaining} days
Actual Progress Pace: {actual_pace}% / day (Required: {required_pace}% / day)
Average Workers on Site: {avg_labor} workers/day
Identified Site Issues / Delays: {[i['issue'] for i in active_issues]}
Recent Work: {[log_item['work_completed'] for log_item in logs[-3:]]}

Respond ONLY in valid JSON matching this schema:
{{
    "executive_summary": "2 sentences summarizing project progress and health",
    "schedule_verdict": "Clear assessment of schedule and finish date predictability",
    "efficiency_rating": "{efficiency_score}/100",
    "key_risks": ["Risk 1", "Risk 2"],
    "actionable_recommendations": [
        "Concrete recommendation 1 for contractor/site engineer",
        "Concrete recommendation 2 for material or labor efficiency",
        "Concrete recommendation 3 to save time or avoid cost overrun"
    ],
    "client_note": "A reassuring and transparent update statement for the homeowner"
}}
"""
                gem_model = genai.GenerativeModel('gemini-3.8-flash')
                res = gem_model.generate_content(prompt)
                res_text = res.text.strip()
                if res_text.startswith('```'):
                    res_text = res_text.split('\n', 1)[1].rsplit('```', 1)[0]
                ai_insights = json.loads(res_text.strip())
                ai_source = "gemini"
            except Exception as e:
                print(f"Gemini project analysis error, using fallback: {e}")
                ai_insights = None

        if not ai_insights:
            if total_logs == 0:
                ai_insights = {
                    "executive_summary": f"{project.name} has been initiated at {project.stage} stage. No daily site logs have been posted yet.",
                    "schedule_verdict": f"Project scheduled for completion by {project.target_date or 'scheduled target date'}.",
                    "efficiency_rating": f"{efficiency_score}/100",
                    "key_risks": [
                        "Awaiting initial site mobilization and first daily progress log."
                    ],
                    "actionable_recommendations": [
                        "Log daily progress and manpower deployment to enable automated schedule tracking.",
                        "Establish baseline material delivery schedule with contractor and structural engineer."
                    ],
                    "client_note": f"Your project '{project.name}' is set up. Daily progress updates will appear as site work commences."
                }
            else:
                ai_insights = {
                    "executive_summary": f"{project.name} is progressing at an active velocity of {actual_pace}% per day with {current_progress}% completion achieved. Daily logs record manpower deployment averaging {avg_labor} artisans.",
                    "schedule_verdict": f"The project is currently {schedule_status.lower()} with target completion estimated on {projected_completion_date} (Target: {project.target_date}).",
                    "efficiency_rating": f"{efficiency_score}/100",
                    "key_risks": [
                        f"{len(active_issues)} logged minor site delay(s) require proactive supply chain buffer to avoid compounding." if active_issues else "Ensure consistent daily inspections and curing schedule adherence."
                    ],
                    "actionable_recommendations": [
                        f"Maintain the current site crew of {int(avg_labor)} workers for optimal {project.stage} productivity.",
                        "Verify material quality test reports prior to proceeding to the next construction milestone."
                    ],
                    "client_note": f"Your project is progressing through the {project.stage} phase. Site safety standards and structural inspections are tracked with daily accountability."
                }

        return Response({
            "project_id": project_id,
            "project_name": project.name,
            "stage": project.stage,
            "progress": current_progress,
            "efficiency_score": efficiency_score,
            "schedule_status": schedule_status,
            "status_color": status_color,
            "metrics": {
                "total_logs": total_logs,
                "avg_labor": avg_labor,
                "total_labor_days": total_labor,
                "days_elapsed": days_elapsed,
                "days_remaining": days_remaining,
                "actual_pace_pct_per_day": actual_pace,
                "required_pace_pct_per_day": required_pace,
                "projected_completion_date": projected_completion_date,
                "target_date": project.target_date
            },
            "stage_breakdown": construction_stages,
            "active_issues": active_issues,
            "ai_insights": ai_insights,
            "ai_source": ai_source
        }, status=status.HTTP_200_OK)
