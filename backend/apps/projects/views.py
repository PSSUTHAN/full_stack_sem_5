import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import Project
from .serializers import ProjectListSerializer, ProjectDetailSerializer, ProjectCreateSerializer


class ProjectListCreateView(APIView):
    """
    GET  /api/projects?user_id=...&role=...
    POST /api/projects
    Matches Flask /api/projects endpoint.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        role = request.query_params.get('role', 'all')
        if role == 'builder':
            role = 'contractor'

        queryset = Project.objects.select_related('client', 'contractor', 'site_engineer').order_by('-id')

        # Enforce authenticated user scope to prevent IDOR
        if request.user and request.user.is_authenticated and not request.user.is_staff:
            user_role = 'contractor' if request.user.role == 'builder' else request.user.role
            if user_role == 'client':
                queryset = queryset.filter(client=request.user)
            elif user_role == 'site_engineer':
                queryset = queryset.filter(site_engineer=request.user)
            elif user_role == 'contractor':
                queryset = queryset.filter(contractor=request.user)
        elif user_id and user_id != 'demo-user':
            try:
                uid = int(user_id)
                if role == 'client':
                    queryset = queryset.filter(client_id=uid)
                elif role == 'site_engineer':
                    queryset = queryset.filter(site_engineer_id=uid)
                elif role == 'contractor':
                    queryset = queryset.filter(contractor_id=uid)
            except (ValueError, TypeError):
                pass

        serializer = ProjectListSerializer(queryset, many=True)
        return Response({"projects": serializer.data})

    def post(self, request):
        data = request.data.copy()
        name = data.get('name', '').strip()
        if not name:
            return Response({"error": "Project name is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Set defaults matching Flask behavior
        if not data.get('start_date'):
            data['start_date'] = datetime.date.today().strftime('%Y-%m-%d')
        if not data.get('target_date'):
            data['target_date'] = (datetime.date.today() + datetime.timedelta(days=120)).strftime('%Y-%m-%d')
        if not data.get('stage'):
            data['stage'] = 'Planning & Excavation'
        if data.get('progress') is None:
            data['progress'] = 0
        if not data.get('status'):
            data['status'] = 'In Progress'
        if not data.get('budget'):
            data['budget'] = '₹50,00,000'
        if not data.get('location'):
            data['location'] = 'Chennai, Tamil Nadu'

        # Map FK field names from request (contractor_id → contractor, etc.)
        for field_name, model_field in [
            ('client_id', 'client'),
            ('contractor_id', 'contractor'),
            ('site_engineer_id', 'site_engineer'),
        ]:
            if field_name in data and model_field not in data:
                data[model_field] = data[field_name]

        serializer = ProjectCreateSerializer(data=data)
        if serializer.is_valid():
            project = serializer.save()
            return Response(
                {"message": "Project created successfully", "project_id": project.id},
                status=status.HTTP_201_CREATED
            )
        return Response({"error": str(serializer.errors)}, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailView(APIView):
    """
    GET  /api/projects/<id>
    PUT  /api/projects/<id>
    Matches Flask /api/projects/<project_id> endpoint.
    """
    permission_classes = [AllowAny]

    def get_object(self, project_id):
        try:
            return Project.objects.select_related('client', 'contractor', 'site_engineer').get(id=project_id)
        except Project.DoesNotExist:
            return None

    def get(self, request, project_id):
        project = self.get_object(project_id)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user and request.user.is_authenticated and not request.user.is_staff:
            uid = request.user.id
            if uid not in (project.client_id, project.contractor_id, project.site_engineer_id):
                return Response(
                    {"error": "Forbidden: You are not authorized to view this project."},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = ProjectDetailSerializer(project)
        return Response({"project": serializer.data})

    def put(self, request, project_id):
        project = self.get_object(project_id)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user and request.user.is_authenticated and not request.user.is_staff:
            uid = request.user.id
            if uid not in (project.contractor_id, project.site_engineer_id):
                return Response(
                    {"error": "Forbidden: Only assigned contractors or site engineers can modify this project."},
                    status=status.HTTP_403_FORBIDDEN
                )

        data = request.data
        updatable_fields = [
            'name', 'description', 'location', 'stage',
            'progress', 'status', 'budget', 'target_date',
        ]
        # Handle FK fields
        fk_map = {
            'client_id': 'client_id',
            'contractor_id': 'contractor_id',
            'site_engineer_id': 'site_engineer_id',
        }

        # Site engineers cannot reassign contractor or client
        if request.user and request.user.is_authenticated and request.user.role == 'site_engineer':
            fk_map = {'site_engineer_id': 'site_engineer_id'}

        for field in updatable_fields:
            if field in data:
                setattr(project, field, data[field])

        for req_field, model_field in fk_map.items():
            if req_field in data:
                setattr(project, model_field, data[req_field])

        if not any(f in data for f in updatable_fields + list(fk_map.keys())):
            return Response({"error": "No fields to update"}, status=status.HTTP_400_BAD_REQUEST)

        project.save()
        return Response({"message": "Project updated successfully"})


class ProjectComponentsView(APIView):
    """
    GET /api/projects/<id>/components
    Returns the work breakdown structure (WBS) for a project based on progress.
    Matches Flask /api/projects/<id>/components endpoint exactly.
    """
    permission_classes = [AllowAny]

    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user and request.user.is_authenticated and not request.user.is_staff:
            uid = request.user.id
            if uid not in (project.client_id, project.contractor_id, project.site_engineer_id):
                return Response(
                    {"error": "Forbidden: You are not authorized to view components for this project."},
                    status=status.HTTP_403_FORBIDDEN
                )

        progress = project.progress or 0

        components = [
            {
                "id": "phase-1",
                "phase": "1. Earthwork & Foundation Substructure",
                "completion": min(100, int(progress / 20 * 100)) if progress <= 20 else 100,
                "tasks": [
                    {"name": "Site Demarcation & Boundary Pegging", "status": "Completed", "qa": "Passed", "specs": "Total station survey, GPS aligned"},
                    {"name": "Earthwork Machine Excavation (16 pits)", "status": "Completed", "qa": "Passed", "specs": "Depth 3.5m, SBC 220 kN/m² verified"},
                    {"name": "PCC 1:4:8 Bed Concreting (100mm)", "status": "Completed", "qa": "Passed", "specs": "Auto-level survey ±2mm variation"},
                    {"name": "Anti-Termite Soil Chemical Barrier", "status": "Completed", "qa": "Passed", "specs": "Chlorpyrifos 20% EC perimeter spray"},
                    {"name": "Footing Steel Mat & Column Starter Anchor", "status": "Completed", "qa": "Passed", "specs": "Fe550D TMT, 50mm clear cover blocks"},
                    {"name": "Column Footings Concreting (M25 Grade)", "status": "Completed", "qa": "Passed", "specs": "Slump 110mm, 6 test cubes cast"},
                    {"name": "Footings Curing & Pit Backfilling", "status": "Completed", "qa": "Passed", "specs": "14-day wet hessian curing certified"},
                ]
            },
            {
                "id": "phase-2",
                "phase": "2. Plinth Beam & Ground Network",
                "completion": min(100, int((progress - 20) / 15 * 100)) if progress > 20 else (100 if progress > 35 else 0),
                "tasks": [
                    {"name": "Plinth Beam Shuttering & Formwork", "status": "Completed" if progress >= 30 else "In Progress", "qa": "Passed", "specs": "Waterproof plywood formwork, oiled"},
                    {"name": "Plinth Beam Reinforcement Bar Bending", "status": "Completed" if progress >= 32 else "In Progress", "qa": "Passed", "specs": "4-16mm main bars, 8mm stirrups @ 150c/c"},
                    {"name": "Plinth Beam Concreting (M25 Design Mix)", "status": "Completed" if progress >= 35 else "In Progress", "qa": "Passed", "specs": "Compacted with 40mm needle vibrator"},
                    {"name": "DPC (Damp Proof Course) 50mm Membrane", "status": "Completed" if progress >= 38 else "In Progress", "qa": "Passed", "specs": "Polyethylene 400-micron waterproof barrier"},
                    {"name": "Internal Floor Trench Soil Compaction", "status": "Completed" if progress >= 40 else "In Progress", "qa": "Passed", "specs": "Compacted in 150mm layers, 95% MDD achieved"},
                ]
            },
            {
                "id": "phase-3",
                "phase": "3. RCC Superstructure Framing",
                "completion": min(100, max(0, int((progress - 35) / 20 * 100))) if progress <= 55 else 100,
                "tasks": [
                    {"name": "Ground-to-First Column Reinforcement Tying", "status": "Completed" if progress >= 42 else "In Progress", "qa": "Passed", "specs": "Fe550D rebar, 50d lap length checked"},
                    {"name": "Column Shuttering Boxes & Plumb Alignment", "status": "Completed" if progress >= 45 else "In Progress", "qa": "Passed", "specs": "Spirit level & plumb bob zero deviation"},
                    {"name": "Column Concreting with Needle Vibrator", "status": "Completed" if progress >= 48 else "In Progress", "qa": "Passed", "specs": "M25 concrete mix, 100% full compaction"},
                    {"name": "Column De-shuttering & 14-Day Wet Curing", "status": "In Progress" if 48 <= progress < 60 else ("Completed" if progress >= 60 else "Upcoming"), "qa": "Active", "specs": "Continuous wet hessian wrapping"},
                    {"name": "First Floor Beam Centering & Formwork", "status": "In Progress" if progress >= 50 else "Upcoming", "qa": "Pending", "specs": "Steel props @ 1m spacing, cross-braced"},
                    {"name": "Floor Roof Slab Reinforcement & Electrical Conduits", "status": "Upcoming", "qa": "Pending", "specs": "Bottom/Top mesh, fan hooks & junction boxes"},
                    {"name": "Roof Slab Casting (M25 RMC)", "status": "Upcoming", "qa": "Pending", "specs": "125mm slab thickness with surface power floater"},
                ]
            },
            {
                "id": "phase-4",
                "phase": "4. Solid Brickwork & Masonry",
                "completion": min(100, max(0, int((progress - 45) / 20 * 100))),
                "tasks": [
                    {"name": "Outer 9-Inch Solid Red Brick Masonry", "status": "In Progress" if progress >= 45 else "Upcoming", "qa": "Active", "specs": "1:6 cement mortar, wire-cut clay bricks"},
                    {"name": "Door & Window Opening Sill Level Setup", "status": "In Progress" if progress >= 47 else "Upcoming", "qa": "Verified", "specs": "Water-level verified across all rooms"},
                    {"name": "RCC Lintel Band & Sunshade Casting", "status": "Upcoming", "qa": "Pending", "specs": "150mm thick lintel band with 75mm chajja"},
                    {"name": "Inner 4.5-Inch Partition Walls", "status": "Upcoming", "qa": "Pending", "specs": "1:4 mortar with RCC hoop iron reinforcement"},
                    {"name": "Parapet Wall & Roof Kerbing", "status": "Upcoming", "qa": "Pending", "specs": "900mm height parapet wall with coping"},
                ]
            },
            {
                "id": "phase-5",
                "phase": "5. Electrical, Plumbing & MEP Rough-in",
                "completion": min(100, max(0, int((progress - 60) / 20 * 100))),
                "tasks": [
                    {"name": "Wall Conduit Chasing & Concealed PVC Pipes", "status": "Upcoming", "qa": "Pending", "specs": "FRLS PVC conduits, wall chased with cutter"},
                    {"name": "Modular Metal Switch Box Fixing", "status": "Upcoming", "qa": "Pending", "specs": "Laser level aligned at 1.2m and 0.45m heights"},
                    {"name": "Water Supply Concealed CPVC Piping", "status": "Upcoming", "qa": "Pending", "specs": "SDR 11 CPVC pipes hot/cold water certified"},
                    {"name": "Soil & Waste SWR Drainage Pipe Network", "status": "Upcoming", "qa": "Pending", "specs": "110mm / 75mm PVC pipes with 1:40 slope"},
                    {"name": "Hydrostatic Pipe Pressure Testing (10 Bar)", "status": "Upcoming", "qa": "Pending", "specs": "24-hour pressure test with zero pressure drop"},
                ]
            },
            {
                "id": "phase-6",
                "phase": "6. Plastering & Waterproofing",
                "completion": min(100, max(0, int((progress - 75) / 15 * 100))),
                "tasks": [
                    {"name": "Ceiling Plastering 1:3 Mortar (6mm)", "status": "Upcoming", "qa": "Pending", "specs": "Hacking on concrete slab, rich cement mortar"},
                    {"name": "Internal Wall Plastering 1:4 Mortar (12mm)", "status": "Upcoming", "qa": "Pending", "specs": "Smooth sponge finish, line dori checked"},
                    {"name": "Sunken Toilet Slab Acrylic Waterproofing", "status": "Upcoming", "qa": "Pending", "specs": "2 coats elastomeric coating with fiberglass mesh"},
                    {"name": "External Sand-Faced Plastering (20mm, 2 coats)", "status": "Upcoming", "qa": "Pending", "specs": "Waterproof compound mixed, sponge finish"},
                    {"name": "Terrace Screed Waterproofing & Brick Bat Coba", "status": "Upcoming", "qa": "Pending", "specs": "Integrated rainwater drainage spouts"},
                ]
            },
            {
                "id": "phase-7",
                "phase": "7. Flooring, Finishing & Fixtures",
                "completion": min(100, max(0, int((progress - 90) / 10 * 100))),
                "tasks": [
                    {"name": "Vitrified Tiles (800x1600mm) / Granite Laying", "status": "Upcoming", "qa": "Pending", "specs": "Polymer modified tile adhesive, 2mm spacers"},
                    {"name": "Wall Putty (2 Coats) & Acrylic Primer", "status": "Upcoming", "qa": "Pending", "specs": "Sanded with 220 grit paper, mirror finish"},
                    {"name": "Premium Interior & Exterior Emulsion Painting", "status": "Upcoming", "qa": "Pending", "specs": "Asian Paints Royale / Apex Ultima 2 coats"},
                    {"name": "Sanitary Ware & CP Chrome Fittings", "status": "Upcoming", "qa": "Pending", "specs": "Wall-hung closets, diverters, shower panels"},
                    {"name": "Modular Electrical Switches & DB Panel Handover", "status": "Upcoming", "qa": "Pending", "specs": "Legrand/Schneider modular switches, MCBs tested"},
                    {"name": "Deep Cleaning & Final Handover Certificate", "status": "Upcoming", "qa": "Pending", "specs": "Final client sign-off and keys handover"},
                ]
            },
        ]

        total_subtasks = sum(len(c['tasks']) for c in components)
        completed_subtasks = sum(
            sum(1 for t in c['tasks'] if t['status'] == 'Completed')
            for c in components
        )
        in_progress_subtasks = sum(
            sum(1 for t in c['tasks'] if t['status'] == 'In Progress')
            for c in components
        )

        return Response({
            "project_id": project_id,
            "project_name": project.name,
            "overall_progress": progress,
            "summary": {
                "total_tasks": total_subtasks,
                "completed_tasks": completed_subtasks,
                "in_progress_tasks": in_progress_subtasks,
                "completion_rate": round(completed_subtasks / total_subtasks * 100, 1) if total_subtasks else 0,
            },
            "components": components,
        })
