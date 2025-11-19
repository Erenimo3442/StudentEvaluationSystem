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
    student_id = models.CharField(max_length=20, unique=True)
    enrollment_term = models.ForeignKey('core.Term', on_delete=models.SET_NULL, null=True)
    program = models.ForeignKey('core.Program', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.student_id})"

class InstructorProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.title})"