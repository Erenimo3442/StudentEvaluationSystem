from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CustomUser, StudentProfile, InstructorProfile
from .serializers import (
    CustomUserSerializer, 
    StudentProfileSerializer, 
    InstructorProfileSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """CRUD operations for users."""
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    
    def get_queryset(self):
        queryset = CustomUser.objects.select_related('department', 'university')
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class StudentProfileViewSet(viewsets.ModelViewSet):
    """CRUD operations for student profiles."""
    queryset = StudentProfile.objects.select_related(
        'user', 'enrollment_term', 'program', 'program__department'
    ).all()
    serializer_class = StudentProfileSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        program_id = self.request.query_params.get('program', None)
        term_id = self.request.query_params.get('term', None)
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if term_id:
            queryset = queryset.filter(enrollment_term_id=term_id)
        
        return queryset


class InstructorProfileViewSet(viewsets.ModelViewSet):
    """CRUD operations for instructor profiles."""
    queryset = InstructorProfile.objects.select_related('user').all()
    serializer_class = InstructorProfileSerializer


# Legacy views for backward compatibility
class UserListView(generics.ListAPIView):
    """List all users."""
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer


class UserDetailView(generics.RetrieveAPIView):
    """Retrieve a single user by PK."""
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
