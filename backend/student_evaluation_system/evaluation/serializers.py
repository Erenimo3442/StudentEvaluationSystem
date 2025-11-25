from rest_framework import serializers
from .models import Assessment, AssessmentLearningOutcomeMapping, StudentGrade, CourseEnrollment
from core.models import Course, LearningOutcome
from users.models import CustomUser

class LearningOutcomeSerializer(serializers.ModelSerializer):
    course = serializers.StringRelatedField()
    
    class Meta:
        model = LearningOutcome
        fields = ['id', 'code', 'description', 'course', 'created_at']

class AssessmentLearningOutcomeMappingSerializer(serializers.ModelSerializer):
    """Nested inside AssessmentSerializer"""
    learning_outcome = LearningOutcomeSerializer(read_only=True)
    learning_outcome_id = serializers.PrimaryKeyRelatedField(
        queryset=LearningOutcome.objects.all(),
        source='learning_outcome',
        write_only=True
    )
    
    class Meta:
        model = AssessmentLearningOutcomeMapping
        fields = ['id', 'learning_outcome', 'learning_outcome_id', 'weight']

class AssessmentSerializer(serializers.ModelSerializer):
    course = serializers.StringRelatedField(read_only=True)
    lo_mappings = AssessmentLearningOutcomeMappingSerializer(many=True, read_only=True)
    
    class Meta:
        model = Assessment
        fields = ['id', 'name', 'course', 'date', 'total_score', 'weight_percentage', 
                  'lo_mappings', 'created_at']

class AssessmentCreateSerializer(serializers.ModelSerializer):
    """For creating/updating assessments"""
    class Meta:
        model = Assessment
        fields = ['id', 'name', 'course', 'date', 'total_score', 'weight_percentage', 'assessment_type']

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