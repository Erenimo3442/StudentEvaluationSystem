from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, StudentProfile, InstructorProfile

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Academic Info', {'fields': ('role', 'university', 'department')}),
    )
    list_display = ('username', 'first_name', 'last_name', 'email', 'role', 'department', 'university')

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(StudentProfile)
admin.site.register(InstructorProfile)