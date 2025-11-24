from rest_framework import generics

# Views for endpoints referenced from core.urls
# - StudentListView / StudentDetailView operate on StudentProfile
# - EvaluationListView / EvaluationDetailView / EvaluationCreateView operate on StudentGrade

from users.models import StudentProfile
from core.models import Course, ProgramOutcome
from users.serializers import StudentProfileSerializer
from core.serializers import CourseSerializer, ProgramOutcomeSerializer

from evaluation.models import StudentGrade
from evaluation.serializers import (
	StudentGradeSerializer,
	StudentGradeCreateSerializer,
)

class StudentListCreateView(generics.ListCreateAPIView):
    """List all student profiles or create a new one."""
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    
class StudentListView(generics.ListAPIView):
	"""List all student profiles."""
	queryset = StudentProfile.objects.select_related('user', 'enrollment_term', 'program').all()
	serializer_class = StudentProfileSerializer


class StudentDetailView(generics.RetrieveAPIView):
	"""Retrieve a single student profile by PK."""
	queryset = StudentProfile.objects.select_related('user', 'enrollment_term', 'program').all()
	serializer_class = StudentProfileSerializer

class CourseListView(generics.ListAPIView):
    """List all courses."""
    queryset = Course.objects.select_related('department', 'term').prefetch_related('instructors').all()
    serializer_class = CourseSerializer

class CourseDetailView(generics.RetrieveAPIView):
    """Retrieve a single course by PK."""
    queryset = Course.objects.select_related('department', 'term').prefetch_related('instructors').all()
    serializer_class = CourseSerializer

class ProgramOutcomeListView(generics.ListAPIView):
    """List all program outcomes."""
    queryset = ProgramOutcome.objects.select_related('department', 'term', 'created_by').all()
    serializer_class = ProgramOutcomeSerializer

class ProgramOutcomeDetailView(generics.RetrieveAPIView):
    """Retrieve a single program outcome by PK."""
    queryset = ProgramOutcome.objects.select_related('department', 'term', 'created_by').all()
    serializer_class = ProgramOutcomeSerializer
