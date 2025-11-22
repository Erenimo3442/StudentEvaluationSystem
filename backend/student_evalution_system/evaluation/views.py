from rest_framework import generics

# Views for endpoints referenced from core.urls
# - StudentListView / StudentDetailView operate on StudentProfile
# - EvaluationListView / EvaluationDetailView / EvaluationCreateView operate on StudentGrade

from users.models import StudentProfile
from users.serializers import StudentProfileSerializer

from evaluation.models import StudentGrade
from evaluation.serializers import (
	StudentGradeSerializer,
	StudentGradeCreateSerializer,
)
class EvaluationListView(generics.ListAPIView):
	"""List all student grades (evaluations)."""
	queryset = StudentGrade.objects.select_related('student', 'assessment', 'assessment__course').all()
	serializer_class = StudentGradeSerializer


class EvaluationDetailView(generics.RetrieveAPIView):
	"""Retrieve a single student grade by PK."""
	queryset = StudentGrade.objects.select_related('student', 'assessment', 'assessment__course').all()
	serializer_class = StudentGradeSerializer


class EvaluationCreateView(generics.CreateAPIView):
	"""Create a student grade (evaluation)."""
	queryset = StudentGrade.objects.all()
	serializer_class = StudentGradeCreateSerializer

