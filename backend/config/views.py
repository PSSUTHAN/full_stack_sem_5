import os
import datetime
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "Engineers Veedu API",
            "framework": "Django REST Framework",
            "version": "1.0.0"
        }, status=status.HTTP_200_OK)


class FileUploadView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    # 10 MB maximum file size limit
    MAX_FILE_SIZE = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
    ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}

    def post(self, request):
        """Upload an image file (e.g. site inspection photo) and return its static URL."""
        if 'file' not in request.FILES:
            return Response({"error": "No file part in request"}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        if not file_obj or file_obj.name == '':
            return Response({"error": "No file selected"}, status=status.HTTP_400_BAD_REQUEST)

        # File size check
        if file_obj.size > self.MAX_FILE_SIZE:
            return Response(
                {"error": "File size exceeds the 10 MB limit."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extension check
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response(
                {"error": f"Unsupported file format. Allowed: {', '.join(sorted(self.ALLOWED_EXTENSIONS))}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # MIME check
        content_type = getattr(file_obj, 'content_type', '').lower()
        if content_type and content_type not in self.ALLOWED_MIME_TYPES:
            return Response(
                {"error": f"Invalid MIME content type: {content_type}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        random_str = os.urandom(4).hex()
        clean_orig_name = "".join(c for c in os.path.splitext(file_obj.name)[0] if c.isalnum() or c in ('-', '_'))[:20]
        filename = f"site_{timestamp}_{random_str}_{clean_orig_name}{ext}"

        upload_folder = os.path.abspath(os.path.join(settings.BASE_DIR, 'uploads'))
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)

        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        file_url = f"/uploads/{filename}"
        return Response({
            "message": "File uploaded successfully",
            "url": file_url,
            "filename": filename
        }, status=status.HTTP_201_CREATED)


def serve_upload(request, filename):
    """Safely serve uploaded media with path traversal protection."""
    upload_folder = os.path.abspath(os.path.join(settings.BASE_DIR, 'uploads'))
    safe_filename = os.path.basename(filename)
    file_path = os.path.abspath(os.path.join(upload_folder, safe_filename))

    # Path traversal validation
    try:
        common = os.path.commonpath([file_path, upload_folder])
    except ValueError as exc:
        raise Http404("File not found") from exc

    if common != upload_folder or not os.path.exists(file_path):
        raise Http404("File not found")

    return FileResponse(open(file_path, 'rb'))
