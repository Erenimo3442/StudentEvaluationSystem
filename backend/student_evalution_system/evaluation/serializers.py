from rest_framework import serializers
from .models import CourseOutcome, Assessment, Assessment_CO_Mapping, StudentGrade, CourseEnrollment
from core.models import Course
from users.models import CustomUser

class CourseOutcomeSerializer(serializers.ModelSerializer):
    course = serializers.StringRelatedField()
    
    class Meta:
        model = CourseOutcome
        fields = ['id', 'code', 'description', 'course', 'created_at']

class AssessmentCOMappingSerializer(serializers.ModelSerializer):
    """Nested inside AssessmentSerializer"""
    course_outcome = CourseOutcomeSerializer(read_only=True)
    course_outcome_id = serializers.PrimaryKeyRelatedField(
        queryset=CourseOutcome.objects.all(),
        source='course_outcome',
        write_only=True
    )
    
    class Meta:
        model = Assessment_CO_Mapping
        fields = ['id', 'course_outcome', 'course_outcome_id', 'weight']

class AssessmentSerializer(serializers.ModelSerializer):
    course = serializers.StringRelatedField(read_only=True)
    co_weights = AssessmentCOMappingSerializer(many=True, read_only=True)
    
    class Meta:
        model = Assessment
        fields = ['id', 'name', 'course', 'date', 'total_score', 'weight_percentage', 
                  'co_weights', 'created_at']

class AssessmentCreateSerializer(serializers.ModelSerializer):
    """For creating/updating assessments"""
    class Meta:
        model = Assessment
        fields = ['id', 'name', 'course', 'date', 'total_score', 'weight_percentage']

class StudentGradeSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()
    assessment = AssessmentSerializer(read_only=True)
    
    class Meta:
        model = StudentGrade
        fields = ['id', 'student', 'assessment', 'score']

class StudentGradeCreateSerializer(serializers.ModelSerializer):
    """For creating/updating grades"""
    class Meta:
        model = StudentGrade
        fields = ['id', 'student', 'assessment', 'score']

class CourseEnrollmentSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()
    course = serializers.StringRelatedField()
    
    class Meta:
        model = CourseEnrollment
        fields = ['id', 'student', 'course', 'enrolled_at']

class MyGradesSerializer(serializers.ModelSerializer):
    """Custom serializer for students to view their grades"""
    assessment_name = serializers.CharField(source='assessment.name')
    course_name = serializers.CharField(source='assessment.course.name')
    course_code = serializers.CharField(source='assessment.course.code')
    total_score = serializers.IntegerField(source='assessment.total_score')
    percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentGrade
        fields = ['id', 'course_code', 'course_name', 'assessment_name', 
                  'score', 'total_score', 'percentage']
    
    def get_percentage(self, obj):
        return (obj.score / obj.assessment.total_score) * 100 if obj.assessment.total_score > 0 else 0