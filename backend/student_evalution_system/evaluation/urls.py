from django.urls import path
from django.contrib import admin
from . import views

urlpatterns = [
    path('evaluation/', views.EvaluationListView.as_view(), name='evaluation-list'),
    path('evaluation/<int:pk>/', views.EvaluationDetailView.as_view(), name='evaluation-detail'),
    path('evaluation/create/', views.EvaluationCreateView.as_view(), name='evaluation-create'),
]
