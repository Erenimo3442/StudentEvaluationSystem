from django.db import models
from django.conf import settings

class CourseOutcome(models.Model):
    description = models.TextField()
    code = models.CharField(max_length=10, unique=True)
    course = models.ForeignKey('core.Course', on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code}: {self.description[:50]}"

class Assessment(models.Model):
    name = models.CharField(max_length=255)
    course = models.ForeignKey('core.Course', on_delete=models.CASCADE)
    date = models.DateField()
    total_score = models.PositiveIntegerField(default=100)
    weight_percentage = models.FloatField(help_text="0.0 to 1.0")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.course.code})"

class Assessment_CO_Mapping(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='co_weights')
    course_outcome = models.ForeignKey(CourseOutcome, on_delete=models.CASCADE)
    weight = models.FloatField(help_text="How much this assessment covers this CO (0.0 to 1.0)")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['assessment', 'course_outcome'], name='unique_assessment_co')
        ]

class StudentGrade(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    score = models.FloatField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'assessment'], name='unique_student_grade')
        ]