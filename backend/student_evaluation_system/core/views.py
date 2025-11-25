from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
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
    queryset = Course.objects.select_related('department', 'term').prefetch_related('instructors').all()
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
