from rest_framework import serializers
from .models import CustomUser, StudentProfile, InstructorProfile
from core.models import Department, University

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'}, label='Confirm Password')
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role']
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    enrollment_term = serializers.StringRelatedField()
    program = serializers.StringRelatedField()
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'student_id', 'enrollment_term', 'program']

class InstructorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = InstructorProfile
        fields = ['id', 'user', 'title']

class UserDetailSerializer(serializers.ModelSerializer):
    department = serializers.StringRelatedField()
    university = serializers.StringRelatedField()
    student_profile = StudentProfileSerializer(source='studentprofile', read_only=True)
    instructor_profile = InstructorProfileSerializer(source='instructorprofile', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'department', 'university', 'student_profile', 'instructor_profile']