from rest_framework import serializers
from core.models import (
    Course, ProgramOutcome, Department, University, Term, Program, DegreeLevel,
    LearningOutcome, LearningOutcomeProgramOutcomeMapping,
    StudentLearningOutcomeScore, StudentProgramOutcomeScore
)
from evaluation.models import Assessment, StudentGrade, CourseEnrollment
from users.models import CustomUser

class DepartmentSerializer(serializers.ModelSerializer):
    university = serializers.StringRelatedField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'university']

class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ['id', 'name']

class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'name', 'is_active']

class DegreeLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DegreeLevel
        fields = ['id', 'name']

class ProgramSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    degree_level = DegreeLevelSerializer(read_only=True)
    
    class Meta:
        model = Program
        fields = ['id', 'name', 'code', 'department', 'degree_level']

class ProgramOutcomeSerializer(serializers.ModelSerializer):
    department = serializers.StringRelatedField()
    term = serializers.StringRelatedField()
    
    class Meta:
        model = ProgramOutcome
        fields = ['id', 'code', 'description', 'department', 'term', 'created_at']

class CourseSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    term = TermSerializer(read_only=True)
    instructors = serializers.StringRelatedField(many=True)
    
    class Meta:
        model = Course
        fields = ['id', 'code', 'name', 'department', 'term', 'instructors', 'created_at']

class LearningOutcomeSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = LearningOutcome
        fields = ['id', 'code', 'description', 'course', 'created_at']

class LearningOutcomeProgramOutcomeMappingSerializer(serializers.ModelSerializer):
    learning_outcome = LearningOutcomeSerializer(read_only=True)
    program_outcome = ProgramOutcomeSerializer(read_only=True)
    
    class Meta:
        model = LearningOutcomeProgramOutcomeMapping
        fields = ['id', 'course', 'learning_outcome', 'program_outcome', 'weight']

class StudentLearningOutcomeScoreSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()
    learning_outcome = LearningOutcomeSerializer(read_only=True)
    
    class Meta:
        model = StudentLearningOutcomeScore
        fields = ['id', 'student', 'learning_outcome', 'score']

class StudentProgramOutcomeScoreSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()
    term = serializers.StringRelatedField()
    program_outcome = ProgramOutcomeSerializer(read_only=True)
    
    class Meta:
        model = StudentProgramOutcomeScore
        fields = ['id', 'student', 'term', 'program_outcome', 'score']
