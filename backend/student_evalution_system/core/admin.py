from django.contrib import admin
from .models import Term, Program, Department, University, ProgramOutcome, Course, CO_PO_Mapping, DegreeLevel

admin.site.register(Term)
admin.site.register(Program)
admin.site.register(ProgramOutcome)
admin.site.register(Department)
admin.site.register(University)
admin.site.register(DegreeLevel)

class CoursePOInline(admin.TabularInline):
    model = CO_PO_Mapping
    extra = 1

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'term')
    inlines = [CoursePOInline] # Allows adding POs directly inside the Course page