from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
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


# Authentication Views
class LoginView(APIView):
    """Login endpoint that returns JWT tokens and user data."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Serialize user data
        user_serializer = CustomUserSerializer(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data
        })


class CurrentUserView(APIView):
    """Get current authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)


# Legacy views for backward compatibility
class UserListView(generics.ListAPIView):
    """List all users."""
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer


class UserDetailView(generics.RetrieveAPIView):
    """Retrieve a single user by PK."""
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
