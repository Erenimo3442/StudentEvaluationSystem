from django.urls import path
from . import views

urlpatterns = [
    #path('students/create/', views.StudentListCreateView.as_view(), name='student-create'),
    path('students/', views.StudentListView.as_view(), name='student-list'),
    path('students/<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('courses/', views.CourseListView.as_view(), name='course-list'),
    path('courses/<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('program-outcomes/', views.ProgramOutcomeListView.as_view(), name='program-outcome-list'),
    path('program-outcomes/<int:pk>/', views.ProgramOutcomeDetailView.as_view(), name='program-outcome-detail'),
    ]