from django.contrib import admin
from .models import CourseOutcome, Assessment, Assessment_CO_Mapping, StudentGrade, CourseEnrollment

admin.site.register(CourseOutcome)
admin.site.register(StudentGrade)
admin.site.register(CourseEnrollment)


class AssessmentCOInline(admin.TabularInline):
    model = Assessment_CO_Mapping
    extra = 1

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'course', 'total_score', 'weight_percentage')
    inlines = [AssessmentCOInline]