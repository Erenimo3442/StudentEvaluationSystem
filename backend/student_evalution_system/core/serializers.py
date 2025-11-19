from rest_framework import serializers
from evaluation.models import CourseOutcome, Assessment, StudentGrade, CourseEnrollment
from core.models import Course, ProgramOutcome, Department, University, Term, Program, DegreeLevel, CO_PO_Mapping
from users.models import CustomUser

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'code']

class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ['id', 'name']

class ProgramSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    degree_level = serializers.StringRelatedField()
    
    class Meta:
        model = Program
        fields = ['id', 'name', 'code', 'degree_level', 'department']

class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'name', 'is_active']

class CourseSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    term = TermSerializer(read_only=True)
    instructors = serializers.StringRelatedField(many=True)
    
    class Meta:
        model = Course
        fields = ['id', 'code', 'name', 'department', 'term', 'instructors', 'created_at']

class ProgramOutcomeSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    
    class Meta:
        model = ProgramOutcome
        fields = ['id', 'code', 'description', 'department', 'term']

