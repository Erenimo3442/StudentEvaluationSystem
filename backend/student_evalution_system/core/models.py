from django.db import models
from django.conf import settings

class Term(models.Model):
    name = models.CharField(max_length=100) # e.g., "Fall 2025"
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.name
    
class Program(models.Model):
    name = models.CharField(max_length=255) 
    code = models.CharField(max_length=10, unique=True) 
    degree_level = models.ForeignKey('DegreeLevel', on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.name} ({self.degree_level})"
    
class DegreeLevel(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
class University(models.Model):
    name = models.CharField(max_length=255)
    
    def __str__(self):
        return self.name

class ProgramOutcome(models.Model):
    description = models.TextField()
    code = models.CharField(max_length=10, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code}: {self.description[:50]}"

class Course(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    instructors = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='courses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code}: {self.name}"

class CO_PO_Mapping(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    course_outcome = models.ForeignKey('evaluation.CourseOutcome', on_delete=models.CASCADE)
    program_outcome = models.ForeignKey(ProgramOutcome, on_delete=models.CASCADE)
    weight_percentage = models.FloatField(help_text="0.0 to 1.0") 

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['course', 'course_outcome', 'program_outcome'], name='unique_co_po_mapping')
        ]


