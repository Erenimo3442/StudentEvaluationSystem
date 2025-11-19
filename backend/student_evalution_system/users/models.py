from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('guest', 'Guest'),
        ('student', 'Student'),
        ('instructor', 'Instructor'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='guest')

    department = models.ForeignKey('core.Department', on_delete=models.SET_NULL, null=True, blank=True)
    university = models.ForeignKey('core.University', on_delete=models.SET_NULL, null=True, blank=True)

class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    surname = models.CharField(max_length=255)
    student_id = models.CharField(max_length=20, unique=True)
    enrollment_term = models.ForeignKey('core.Term', on_delete=models.SET_NULL, null=True)

class InstructorProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    surname = models.CharField(max_length=255)