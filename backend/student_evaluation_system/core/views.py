from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema_view, extend_schema

from .models import (
    University, Department, DegreeLevel, Program, Term,
    Course, ProgramOutcome, LearningOutcome,
    LearningOutcomeProgramOutcomeMapping,
    StudentLearningOutcomeScore, StudentProgramOutcomeScore
)
from .serializers import (
    UniversitySerializer, DepartmentSerializer, DegreeLevelSerializer,
    ProgramSerializer, TermSerializer, CourseSerializer,
    ProgramOutcomeSerializer, LearningOutcomeSerializer,
    LearningOutcomeProgramOutcomeMappingSerializer,
    StudentLearningOutcomeScoreSerializer, StudentProgramOutcomeScoreSerializer
)
from users.models import StudentProfile
from users.serializers import StudentProfileSerializer

@extend_schema_view(
    list=extend_schema(tags=['Academic Structure']),
    retrieve=extend_schema(tags=['Academic Structure']),
    create=extend_schema(tags=['Academic Structure']),
    update=extend_schema(tags=['Academic Structure']),
    partial_update=extend_schema(tags=['Academic Structure']),
    destroy=extend_schema(tags=['Academic Structure']),
)
class UniversityViewSet(viewsets.ModelViewSet):
    """CRUD operations for universities."""
    queryset = University.objects.all()
    serializer_class = UniversitySerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for departments."""
    queryset = Department.objects.select_related('university').all()
    serializer_class = DepartmentSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        university_id = self.request.query_params.get('university', None)
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        return queryset


class DegreeLevelViewSet(viewsets.ModelViewSet):
    """CRUD operations for degree levels."""
    queryset = DegreeLevel.objects.all()
    serializer_class = DegreeLevelSerializer


class ProgramViewSet(viewsets.ModelViewSet):
    """CRUD operations for programs."""
    queryset = Program.objects.select_related('department', 'degree_level').all()
    serializer_class = ProgramSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        department_id = self.request.query_params.get('department', None)
        degree_level_id = self.request.query_params.get('degree_level', None)
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if degree_level_id:
            queryset = queryset.filter(degree_level_id=degree_level_id)
        
        return queryset


class TermViewSet(viewsets.ModelViewSet):
    """CRUD operations for terms."""
    queryset = Term.objects.all()
    serializer_class = TermSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active term."""
        active_term = Term.objects.filter(is_active=True).first()
        if active_term:
            serializer = self.get_serializer(active_term)
            return Response(serializer.data)
        return Response({'detail': 'No active term found.'}, status=404)


class CourseViewSet(viewsets.ModelViewSet):
    """CRUD operations for courses."""
    queryset = Course.objects.select_related('program', 'term').prefetch_related('instructors').all()
    serializer_class = CourseSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        department_id = self.request.query_params.get('department', None)
        term_id = self.request.query_params.get('term', None)
        instructor_id = self.request.query_params.get('instructor', None)
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        if instructor_id:
            queryset = queryset.filter(instructors__id=instructor_id)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def learning_outcomes(self, request, pk=None):
        """Get all learning outcomes for this course."""
        course = self.get_object()
        outcomes = course.learning_outcomes.all()
        serializer = LearningOutcomeSerializer(outcomes, many=True)
        return Response(serializer.data)

@extend_schema_view(
    list=extend_schema(tags=['Outcomes']),
    retrieve=extend_schema(tags=['Outcomes']),
    create=extend_schema(tags=['Outcomes']),
    update=extend_schema(tags=['Outcomes']),
    partial_update=extend_schema(tags=['Outcomes']),
    destroy=extend_schema(tags=['Outcomes']),
)
class ProgramOutcomeViewSet(viewsets.ModelViewSet):
    """CRUD operations for program outcomes."""
    queryset = ProgramOutcome.objects.select_related('department', 'term', 'created_by').all()
    serializer_class = ProgramOutcomeSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        department_id = self.request.query_params.get('department', None)
        term_id = self.request.query_params.get('term', None)
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        
        return queryset


class LearningOutcomeViewSet(viewsets.ModelViewSet):
    """CRUD operations for learning outcomes."""
    queryset = LearningOutcome.objects.select_related('course', 'created_by').all()
    serializer_class = LearningOutcomeSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course', None)
        
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset


class LearningOutcomeProgramOutcomeMappingViewSet(viewsets.ModelViewSet):
    """CRUD operations for LO-PO mappings."""
    queryset = LearningOutcomeProgramOutcomeMapping.objects.select_related(
        'course', 'learning_outcome', 'program_outcome'
    ).all()
    serializer_class = LearningOutcomeProgramOutcomeMappingSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course', None)
        
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset


class StudentLearningOutcomeScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only access to calculated LO scores."""
    queryset = StudentLearningOutcomeScore.objects.select_related(
        'student', 'learning_outcome', 'learning_outcome__course'
    ).all()
    serializer_class = StudentLearningOutcomeScoreSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student', None)
        course_id = self.request.query_params.get('course', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(learning_outcome__course_id=course_id)
        
        return queryset


class StudentProgramOutcomeScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only access to calculated PO scores."""
    queryset = StudentProgramOutcomeScore.objects.select_related(
        'student', 'program_outcome', 'term'
    ).all()
    serializer_class = StudentProgramOutcomeScoreSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student', None)
        course_id = self.request.query_params.get('course', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset


# Legacy views for backward compatibility
class StudentListView(generics.ListAPIView):
    queryset = StudentProfile.objects.select_related('user', 'enrollment_term', 'program').all()
    serializer_class = StudentProfileSerializer


class StudentDetailView(generics.RetrieveAPIView):
    queryset = StudentProfile.objects.select_related('user', 'enrollment_term', 'program').all()
    serializer_class = StudentProfileSerializer


class CourseListView(generics.ListAPIView):
    queryset = Course.objects.select_related('department', 'term').prefetch_related('instructors').all()
    serializer_class = CourseSerializer


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.select_related('department', 'term').prefetch_related('instructors').all()
    serializer_class = CourseSerializer


class ProgramOutcomeListView(generics.ListAPIView):
    queryset = ProgramOutcome.objects.select_related('department', 'term', 'created_by').all()
    serializer_class = ProgramOutcomeSerializer


class ProgramOutcomeDetailView(generics.RetrieveAPIView):
    queryset = ProgramOutcome.objects.select_related('department', 'term', 'created_by').all()
    serializer_class = ProgramOutcomeSerializer


@extend_schema_view(
    create=extend_schema(tags=['File Import']),
)
class FileImportViewSet(viewsets.GenericViewSet):
    """
    ViewSet for handling file imports.
    
    This endpoint allows bulk import of data through various file formats.
    Supports importing students, courses, assessments, and other entities.
    Uses modular parser system to support multiple file formats (Excel, CSV, etc.).
    """
    parser_classes = [MultiPartParser, FormParser]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.file_service = None
    
    @action(detail=False, methods=['get', 'post'], url_path='upload')
    def upload_assignments(self, request):
        """
        Upload assignment scores from a file, for a specific course.
        
        GET: Display upload form interface
        POST: Process the uploaded file
        
        Expected request format:
        - file: File (.xlsx, .xls, .csv, etc.)
        - import_type: Type of import (students, courses, assessments, etc.)
        - sheet_name: Name of the sheet/section to import from (optional, uses default)
        
        Returns:
            dict: Import results with created/updated counts and any errors
        """
        if request.method == 'GET':
            return Response({
                'message': 'File Upload Endpoint',
                'description': 'POST a file here to import data. Use multipart/form-data.',
                'required_fields': {
                    'file': 'File to upload (.xlsx, .xls, .csv)',
                    'import_type': 'Type of import (auto, students, courses, assessments, grades, learning_outcomes, program_outcomes)',
                    'sheet_name': 'Specific sheet name (optional)'
                },
                'example_curl': [
                    'curl -X POST \\',
                    '  -H "Content-Type: multipart/form-data" \\',
                    '  -F "file=@your_file.xlsx" \\',
                    '  -F "import_type=auto" \\',
                    '  http://localhost:8000/api/core/file-import/upload/'
                ],
                'supported_import_types': [
                    'auto - Automatically detect and import all sheets',
                    'students - Import student data',
                    'courses - Import course data',
                    'assessments - Import assessment data',
                    'grades - Import student grades',
                    'learning_outcomes - Import learning outcomes',
                    'program_outcomes - Import program outcomes'
                ]
            })
        
        # POST method implementation
        """
        Upload and process a file for data import.
        
        Expected request format:
        - file: Excel file with assignments and scores
        
        Returns:
            dict: Import results with created/updated counts and any errors
        """
        try:
            # Validate file presence
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_obj = request.FILES['file']
            course = request.data.get('course', None)
            # Initialize file import service
            from .services.file_import import FileImportService, FileImportError
            self.file_service = FileImportService(file_obj)
            
            # Validate file format
            self.file_service.validate_file()
            
            # Determine import strategy
            if import_type == 'auto':
                # Auto-detect based on sheet/section names
                results = self._auto_import()
            else:
                # Import specific type
                results = self._import_specific_type(import_type, sheet_name)
            
            return Response({
                'message': 'Import completed successfully',
                'results': results
            }, status=status.HTTP_200_OK)
            
        except FileImportError as e:
            return Response({
                'error': str(e),
                'results': self.file_service.get_import_summary() if self.file_service else {}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'error': f'Unexpected error during import: {str(e)}',
                'results': self.file_service.get_import_summary() if self.file_service else {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get', 'post'], url_path='validate')
    def validate_file(self, request):
        """
        Validate file format without importing data.
        
        GET: Display validation endpoint information
        POST: Validate the uploaded file
        
        Returns:
            dict: Available sheets/sections and validation results
        """
        if request.method == 'GET':
            return Response({
                'message': 'File Validation Endpoint',
                'description': 'POST a file here to validate its format without importing data.',
                'required_fields': {
                    'file': 'File to validate (.xlsx, .xls, .csv)'
                },
                'example_curl': [
                    'curl -X POST \\',
                    '  -H "Content-Type: multipart/form-data" \\',
                    '  -F "file=@your_file.xlsx" \\',
                    '  http://localhost:8000/api/core/file-import/validate/'
                ]
            })
        
        # POST method implementation
        """
        Validate file format without importing data.
        
        Returns:
            dict: Available sheets/sections and validation results
        """
        try:
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_obj = request.FILES['file']
            
            from .services.file_import import FileImportService, FileImportError
            file_service = FileImportService(file_obj)
            file_service.validate_file()
            
            available_sheets = file_service.get_available_sheets()
            
            return Response({
                'message': 'File format is valid',
                'available_sheets': available_sheets,
                'file_info': {
                    'name': file_obj.name,
                    'size': file_obj.size,
                    'format': file_service.detect_file_format()
                }
            }, status=status.HTTP_200_OK)
            
        except FileImportError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': f'Validation error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _auto_import(self):
        """
        Automatically import all recognized sheets from the file.
        
        Returns:
            dict: Combined import results
        """
        available_sheets = self.file_service.get_available_sheets()
        results = {'created': {}, 'updated': {}, 'errors': []}
        
        # Define import methods for different sheet types
        import_methods = {
            'students': self.file_service.import_students,
            'courses': self.file_service.import_courses,
            'assessments': self.file_service.import_assessments,
            'grades': self.file_service.import_grades,
            'learning_outcomes': self.file_service.import_learning_outcomes,
            'program_outcomes': self.file_service.import_program_outcomes
        }
        
        for sheet_name in available_sheets:
            sheet_lower = sheet_name.lower()
            
            # Find matching import method
            for key, method in import_methods.items():
                if key in sheet_lower:
                    try:
                        sheet_result = method(sheet_name=sheet_name)
                        
                        # Merge results
                        for key_type in ['created', 'updated']:
                            if key_type in sheet_result:
                                for entity, count in sheet_result[key_type].items():
                                    if entity not in results[key_type]:
                                        results[key_type][entity] = 0
                                    results[key_type][entity] += count
                        
                        if 'errors' in sheet_result:
                            results['errors'].extend(sheet_result['errors'])
                            
                    except Exception as e:
                        results['errors'].append(f"Error importing sheet '{sheet_name}': {str(e)}")
                    break
        
        return results
    
    def _import_specific_type(self, import_type, sheet_name):
        """
        Import a specific type of data from the file.
        
        Args:
            import_type (str): Type of import (students, courses, etc.)
            sheet_name (str): Name of the sheet/section to import from
            
        Returns:
            dict: Import results
        """
        from .services.file_import import FileImportError
        
        import_methods = {
            'students': self.file_service.import_students,
            'courses': self.file_service.import_courses,
            'assessments': self.file_service.import_assessments,
            'grades': self.file_service.import_grades,
            'learning_outcomes': self.file_service.import_learning_outcomes,
            'program_outcomes': self.file_service.import_program_outcomes
        }
        
        if import_type not in import_methods:
            raise FileImportError(f"Unsupported import type: {import_type}")
        
        # Use provided sheet name or default
        if not sheet_name:
            sheet_name = import_type
        
        return import_methods[import_type](sheet_name=sheet_name)
