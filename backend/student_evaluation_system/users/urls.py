from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'students', views.StudentProfileViewSet, basename='student')
router.register(r'instructors', views.InstructorProfileViewSet, basename='instructor')

urlpatterns = [
    path('', include(router.urls)),
]
