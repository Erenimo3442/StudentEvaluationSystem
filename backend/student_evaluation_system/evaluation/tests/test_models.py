"""
Tests for evaluation app models.

This module tests the models in the evaluation app including:
- Assessment, AssessmentLearningOutcomeMapping
- StudentGrade, CourseEnrollment
"""

import pytest
from django.core.exceptions import ValidationError
from datetime import date
from evaluation.models import (
    Assessment, AssessmentLearningOutcomeMapping, StudentGrade, CourseEnrollment
)
from core.models import LearningOutcome


@pytest.mark.django_db
class TestAssessment:
    """Tests for Assessment model."""

    def test_create_assessment(self, db_setup, user_factory):
        """Test creating an assessment."""
        course = db_setup['course']
        user = user_factory('instructor1', role='instructor')

        assessment = Assessment.objects.create(
            name="Midterm Exam",
            assessment_type="midterm",
            course=course,
            date=date.today(),
            total_score=100,
            weight=0.3,
            created_by=user
        )

        assert assessment.name == "Midterm Exam"
        assert assessment.assessment_type == "midterm"
        assert assessment.course == course
        assert assessment.total_score == 100
        assert assessment.weight == 0.3
        assert assessment.created_by == user
        assert "Midterm Exam" in str(assessment)

    def test_assessment_type_choices(self, db_setup, user_factory):
        """Test that assessment type must be valid choice."""
        course = db_setup['course']
        user = user_factory('instructor1', role='instructor')

        # Valid types
        valid_types = ['midterm', 'final', 'homework', 'project', 'quiz', 'attendance', 'other']
        for assessment_type in valid_types:
            assessment = Assessment(
                name=f"Test {assessment_type}",
                assessment_type=assessment_type,
                course=course,
                date=date.today(),
                total_score=100,
                weight=0.2,
                created_by=user
            )
            assessment.full_clean()  # Should not raise

    def test_assessment_weight_validation(self, db_setup, user_factory):
        """Test that weight must be between 0 and 1."""
        course = db_setup['course']
        user = user_factory('instructor1', role='instructor')

        # Valid weight
        assessment = Assessment.objects.create(
            name="Valid Assessment",
            assessment_type="homework",
            course=course,
            date=date.today(),
            total_score=100,
            weight=0.5,
            created_by=user
        )
        assert assessment.weight == 0.5

        # Invalid weight (> 1.0)
        with pytest.raises(ValidationError):
            invalid_assessment = Assessment(
                name="Invalid Assessment",
                assessment_type="homework",
                course=course,
                date=date.today(),
                total_score=100,
                weight=1.5,
                created_by=user
            )
            invalid_assessment.full_clean()

        # Invalid weight (< 0.0)
        with pytest.raises(ValidationError):
            invalid_assessment = Assessment(
                name="Invalid Assessment",
                assessment_type="homework",
                course=course,
                date=date.today(),
                total_score=100,
                weight=-0.1,
                created_by=user
            )
            invalid_assessment.full_clean()


@pytest.mark.django_db
class TestAssessmentLearningOutcomeMapping:
    """Tests for Assessment-LO mapping model."""

    def test_create_mapping(self, sample_assessments, sample_course):
        """Test creating assessment-LO mapping."""
        assessment = sample_assessments['midterm']
        lo = sample_course['learning_outcomes'][0]

        mapping = AssessmentLearningOutcomeMapping.objects.create(
            assessment=assessment,
            learning_outcome=lo,
            weight=0.6
        )

        assert mapping.assessment == assessment
        assert mapping.learning_outcome == lo
        assert mapping.weight == 0.6
        assert "0.60" in str(mapping)

    def test_mapping_unique_constraint(self, sample_assessments, sample_course):
        """Test that mapping must be unique per assessment and LO."""
        assessment = sample_assessments['midterm']
        lo = sample_course['learning_outcomes'][0]

        AssessmentLearningOutcomeMapping.objects.create(
            assessment=assessment,
            learning_outcome=lo,
            weight=0.5
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            AssessmentLearningOutcomeMapping.objects.create(
                assessment=assessment,
                learning_outcome=lo,
                weight=0.6
            )

    def test_mapping_weight_validation(self, sample_assessments, sample_course):
        """Test that weight must be between 0 and 1."""
        assessment = sample_assessments['midterm']
        lo = sample_course['learning_outcomes'][0]

        # Valid weight
        mapping = AssessmentLearningOutcomeMapping.objects.create(
            assessment=assessment,
            learning_outcome=lo,
            weight=0.7
        )
        assert mapping.weight == 0.7

        # Invalid weight (> 1.0)
        with pytest.raises(ValidationError):
            invalid_mapping = AssessmentLearningOutcomeMapping(
                assessment=assessment,
                learning_outcome=lo,
                weight=1.2
            )
            invalid_mapping.full_clean()

        # Invalid weight (< 0.0)
        with pytest.raises(ValidationError):
            invalid_mapping = AssessmentLearningOutcomeMapping(
                assessment=assessment,
                learning_outcome=lo,
                weight=-0.1
            )
            invalid_mapping.full_clean()


@pytest.mark.django_db
class TestStudentGrade:
    """Tests for StudentGrade model."""

    def test_create_grade(self, sample_assessments, student_factory):
        """Test creating a student grade."""
        assessment = sample_assessments['midterm']
        student = student_factory('student1')

        grade = StudentGrade.objects.create(
            student=student.user,
            assessment=assessment,
            score=85.5
        )

        assert grade.student == student.user
        assert grade.assessment == assessment
        assert grade.score == 85.5
        assert "85.0" in str(grade)

    def test_grade_unique_constraint(self, sample_assessments, student_factory):
        """Test that grade must be unique per student and assessment."""
        assessment = sample_assessments['midterm']
        student = student_factory('student1')

        StudentGrade.objects.create(
            student=student.user,
            assessment=assessment,
            score=75.0
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            StudentGrade.objects.create(
                student=student.user,
                assessment=assessment,
                score=80.0
            )

    def test_grade_score_not_exceed_total(self, sample_assessments, student_factory):
        """Test that score cannot exceed assessment total."""
        assessment = sample_assessments['midterm']  # total_score = 100
        student = student_factory('student1')

        # Valid score
        grade = StudentGrade.objects.create(
            student=student.user,
            assessment=assessment,
            score=100.0
        )
        assert grade.score == 100.0

        # Invalid score (> total_score)
        grade_invalid = StudentGrade(
            student=student.user,
            assessment=assessment,
            score=150.0
        )
        with pytest.raises(ValidationError):
            grade_invalid.full_clean()

    def test_grade_minimum_value(self, sample_assessments, student_factory):
        """Test that score must be >= 0."""
        assessment = sample_assessments['midterm']
        student = student_factory('student1')

        # Valid score
        grade = StudentGrade.objects.create(
            student=student.user,
            assessment=assessment,
            score=0.0
        )
        assert grade.score == 0.0

        # Invalid score (< 0)
        grade_invalid = StudentGrade(
            student=student.user,
            assessment=assessment,
            score=-10.0
        )
        with pytest.raises(ValidationError):
            grade_invalid.full_clean()

    def test_grade_requires_enrollment(self, sample_assessments, student_factory):
        """Test that student must be enrolled in the course."""
        assessment = sample_assessments['midterm']
        student = student_factory('student1')

        # Don't enroll student

        grade = StudentGrade(
            student=student.user,
            assessment=assessment,
            score=85.0
        )

        with pytest.raises(ValidationError, match='enrolled'):
            grade.full_clean()

    def test_percentage_property(self, sample_assessments, student_factory):
        """Test the percentage property calculation."""
        assessment = sample_assessments['midterm']
        student = student_factory('student_factory')

        # Enroll student
        CourseEnrollment.objects.create(
            student=student.user,
            course=assessment.course
        )

        # Create grade
        grade = StudentGrade.objects.create(
            student=student.user,
            assessment=assessment,
            score=85.0
        )

        # Calculate percentage
        expected_percentage = (85.0 / assessment.total_score) * 100
        assert grade.percentage == expected_percentage

    def test_percentage_zero_total_score(self, sample_assessments, student_factory):
        """Test percentage when total_score is 0 (edge case)."""
        assessment = sample_assessments['midterm']
        assessment.total_score = 0
        assessment.save()

        student = student_factory('student1')

        # Enroll student
        CourseEnrollment.objects.create(
            student=student.user,
            course=assessment.course
        )

        grade = StudentGrade.objects.create(
            student=student.user,
            assessment=assessment,
            score=85.0
        )

        # Should return 0 to avoid division by zero
        assert grade.percentage == 0


@pytest.mark.django_db
class TestCourseEnrollment:
    """Tests for CourseEnrollment model."""

    def test_create_enrollment(self, db_setup, student_factory):
        """Test creating a course enrollment."""
        course = db_setup['course']
        student = student_factory('student1')

        enrollment = CourseEnrollment.objects.create(
            student=student.user,
            course=course
        )

        assert enrollment.student == student.user
        assert enrollment.course == course
        assert enrollment.enrolled_at is not None
        assert str(course.code) in str(enrollment)

    def test_enrollment_unique_constraint(self, db_setup, student_factory):
        """Test that enrollment must be unique per student and course."""
        course = db_setup['course']
        student = student_factory('student1')

        CourseEnrollment.objects.create(
            student=student.user,
            course=course
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            CourseEnrollment.objects.create(
                student=student.user,
                course=course
            )

    def test_multiple_students_can_enroll(self, db_setup, student_factory):
        """Test that multiple students can enroll in the same course."""
        course = db_setup['course']

        student1 = student_factory('student1')
        student2 = student_factory('student2')
        student3 = student_factory('student3')

        enrollment1 = CourseEnrollment.objects.create(
            student=student1.user,
            course=course
        )
        enrollment2 = CourseEnrollment.objects.create(
            student=student2.user,
            course=course
        )
        enrollment3 = CourseEnrollment.objects.create(
            student=student3.user,
            course=course
        )

        assert CourseEnrollment.objects.filter(course=course).count() == 3

    def test_student_can_enroll_in_multiple_courses(self, db_setup, student_factory):
        """Test that a student can enroll in multiple courses."""
        program = db_setup['program']
        term = db_setup['term']
        student = student_factory('student1')

        # Create additional courses
        course1 = db_setup['course']
        course2 = Course.objects.create(
            code="TEST102",
            name="Another Course",
            credits=3,
            program=program,
            term=term
        )
        course3 = Course.objects.create(
            code="TEST103",
            name="Yet Another Course",
            credits=3,
            program=program,
            term=term
        )

        # Enroll student in all courses
        enrollment1 = CourseEnrollment.objects.create(
            student=student.user,
            course=course1
        )
        enrollment2 = CourseEnrollment.objects.create(
            student=student.user,
            course=course2
        )
        enrollment3 = CourseEnrollment.objects.create(
            student=student.user,
            course=course3
        )

        assert CourseEnrollment.objects.filter(student=student.user).count() == 3
