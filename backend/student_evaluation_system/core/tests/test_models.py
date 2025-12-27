"""
Tests for core app models.

This module tests the models in the core app including:
- University, Department, DegreeLevel, Program, Term
- Course, LearningOutcome, ProgramOutcome
- LearningOutcomeProgramOutcomeMapping
- StudentLearningOutcomeScore, StudentProgramOutcomeScore
"""

import pytest
from django.core.exceptions import ValidationError
from datetime import date
from core.models import (
    University, Department, DegreeLevel, Program, Term,
    Course, ProgramOutcome, LearningOutcome,
    LearningOutcomeProgramOutcomeMapping, StudentLearningOutcomeScore,
    StudentProgramOutcomeScore
)
from users.models import StudentProfile


@pytest.mark.django_db
class TestUniversity:
    """Tests for University model."""

    def test_create_university(self):
        """Test creating a university."""
        university = University.objects.create(name="MIT")
        assert university.name == "MIT"
        assert str(university) == "MIT"

    def test_university_unique_name(self):
        """Test that university name must be unique."""
        University.objects.create(name="Stanford")
        with pytest.raises(Exception):  # IntegrityError
            University.objects.create(name="Stanford")


@pytest.mark.django_db
class TestDepartment:
    """Tests for Department model."""

    def test_create_department(self, db_setup):
        """Test creating a department."""
        university = db_setup['university']
        department = Department.objects.create(
            code="CS",
            name="Computer Science",
            university=university
        )
        assert department.code == "CS"
        assert department.name == "Computer Science"
        assert department.university == university
        assert "CS" in str(department)

    def test_department_unique_code(self, db_setup):
        """Test that department code must be unique."""
        university = db_setup['university']
        Department.objects.create(code="ENG", name="Engineering", university=university)
        with pytest.raises(Exception):  # IntegrityError
            Department.objects.create(code="ENG", name="English", university=university)


@pytest.mark.django_db
class TestDegreeLevel:
    """Tests for DegreeLevel model."""

    def test_create_degree_level(self):
        """Test creating a degree level."""
        degree_level = DegreeLevel.objects.create(name="Master's")
        assert degree_level.name == "Master's"
        assert str(degree_level) == "Master's"

    def test_degree_level_unique_name(self):
        """Test that degree level name must be unique."""
        DegreeLevel.objects.create(name="PhD")
        with pytest.raises(Exception):  # IntegrityError
            DegreeLevel.objects.create(name="PhD")


@pytest.mark.django_db
class TestProgram:
    """Tests for Program model."""

    def test_create_program(self, db_setup):
        """Test creating a program."""
        department = db_setup['department']
        degree_level = db_setup['degree_level']

        program = Program.objects.create(
            code="MSCS",
            name="Master of Computer Science",
            degree_level=degree_level,
            department=department
        )

        assert program.code == "MSCS"
        assert program.name == "Master of Computer Science"
        assert program.degree_level == degree_level
        assert program.department == department
        assert "MSCS" in str(program)

    def test_program_unique_code(self, db_setup):
        """Test that program code must be unique."""
        program = db_setup['program']
        with pytest.raises(Exception):  # IntegrityError
            Program.objects.create(
                code=program.code,
                name="Different Name",
                degree_level=program.degree_level,
                department=program.department
            )


@pytest.mark.django_db
class TestTerm:
    """Tests for Term model."""

    def test_create_term(self):
        """Test creating a term."""
        term = Term.objects.create(name="Spring 2025", is_active=False)
        assert term.name == "Spring 2025"
        assert term.is_active is False
        assert "Spring 2025" in str(term)

    def test_active_term_deactivates_others(self):
        """Test that setting a term as active deactivates other terms."""
        term1 = Term.objects.create(name="Fall 2024", is_active=True)
        term2 = Term.objects.create(name="Spring 2025", is_active=False)

        # Activate term2
        term2.is_active = True
        term2.save()

        # Refresh from database
        term1.refresh_from_db()
        term2.refresh_from_db()

        assert term2.is_active is True
        assert term1.is_active is False


@pytest.mark.django_db
class TestCourse:
    """Tests for Course model."""

    def test_create_course(self, db_setup):
        """Test creating a course."""
        course = db_setup['course']
        assert course.code == "TEST101"
        assert course.name == "Test Course"
        assert course.credits == 3
        assert str(course) == "TEST101: Test Course"

    def test_course_unique_constraint_per_program_term(self, db_setup):
        """Test that course code must be unique per program and term."""
        program = db_setup['program']
        term = db_setup['term']

        Course.objects.create(
            code="MATH101",
            name="Calculus I",
            program=program,
            term=term,
            credits=4
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            Course.objects.create(
                code="MATH101",
                name="Calculus I - Duplicate",
                program=program,
                term=term,
                credits=4
            )

    def test_course_total_assessments_property(self, db_setup, sample_assessments):
        """Test total_assessments property."""
        course = sample_assessments['course']
        assert course.total_assessments == 3

    def test_course_enrolled_students_count_property(self, db_setup, sample_enrollment):
        """Test enrolled_students_count property."""
        course = sample_enrollment['course']
        assert course.enrolled_students_count == 3


@pytest.mark.django_db
class TestLearningOutcome:
    """Tests for LearningOutcome model."""

    def test_create_learning_outcome(self, db_setup):
        """Test creating a learning outcome."""
        course = db_setup['course']

        lo = LearningOutcome.objects.create(
            code="LO1",
            description="Understand fundamental concepts",
            course=course
        )

        assert lo.code == "LO1"
        assert lo.description == "Understand fundamental concepts"
        assert lo.course == course
        assert "LO1" in str(lo)

    def test_lo_unique_constraint_per_course(self, db_setup):
        """Test that LO code must be unique per course."""
        course = db_setup['course']

        LearningOutcome.objects.create(
            code="LO1",
            description="First LO",
            course=course
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            LearningOutcome.objects.create(
                code="LO1",
                description="Duplicate LO",
                course=course
            )


@pytest.mark.django_db
class TestProgramOutcome:
    """Tests for ProgramOutcome model."""

    def test_create_program_outcome(self, db_setup):
        """Test creating a program outcome."""
        program = db_setup['program']
        term = db_setup['term']

        po = ProgramOutcome.objects.create(
            code="PO1",
            description="Apply engineering knowledge",
            program=program,
            term=term
        )

        assert po.code == "PO1"
        assert po.description == "Apply engineering knowledge"
        assert po.program == program
        assert po.term == term
        assert "PO1" in str(po)

    def test_po_unique_constraint_per_program_term(self, db_setup):
        """Test that PO code must be unique per program and term."""
        program = db_setup['program']
        term = db_setup['term']

        ProgramOutcome.objects.create(
            code="PO1",
            description="First PO",
            program=program,
            term=term
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            ProgramOutcome.objects.create(
                code="PO1",
                description="Duplicate PO",
                program=program,
                term=term
            )


@pytest.mark.django_db
class TestLearningOutcomeProgramOutcomeMapping:
    """Tests for LO-PO mapping model."""

    def test_create_mapping(self, sample_course):
        """Test creating LO-PO mapping."""
        course = sample_course['course']
        lo = sample_course['learning_outcomes'][0]
        po = sample_course['program_outcomes'][0]

        mapping = LearningOutcomeProgramOutcomeMapping.objects.create(
            course=course,
            learning_outcome=lo,
            program_outcome=po,
            weight=0.7
        )

        assert mapping.course == course
        assert mapping.learning_outcome == lo
        assert mapping.program_outcome == po
        assert mapping.weight == 0.7

    def test_mapping_unique_constraint(self, sample_course):
        """Test that mapping must be unique per course, LO, and PO."""
        course = sample_course['course']
        lo = sample_course['learning_outcomes'][0]
        po = sample_course['program_outcomes'][0]

        LearningOutcomeProgramOutcomeMapping.objects.create(
            course=course,
            learning_outcome=lo,
            program_outcome=po,
            weight=0.5
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            LearningOutcomeProgramOutcomeMapping.objects.create(
                course=course,
                learning_outcome=lo,
                program_outcome=po,
                weight=0.6
            )

    def test_mapping_weight_validation(self, sample_course):
        """Test that weight must be between 0 and 1."""
        course = sample_course['course']
        lo = sample_course['learning_outcomes'][0]
        po = sample_course['program_outcomes'][0]

        # Valid weight
        mapping = LearningOutcomeProgramOutcomeMapping.objects.create(
            course=course,
            learning_outcome=lo,
            program_outcome=po,
            weight=0.5
        )
        assert mapping.weight == 0.5

        # Invalid weight (> 1.0)
        with pytest.raises(ValidationError):
            mapping_invalid = LearningOutcomeProgramOutcomeMapping(
                course=course,
                learning_outcome=lo,
                program_outcome=po,
                weight=1.5
            )
            mapping_invalid.full_clean()

        # Invalid weight (< 0.0)
        with pytest.raises(ValidationError):
            mapping_invalid = LearningOutcomeProgramOutcomeMapping(
                course=course,
                learning_outcome=lo,
                program_outcome=po,
                weight=-0.1
            )
            mapping_invalid.full_clean()

    def test_mapping_validation_lo_must_belong_to_course(self, db_setup):
        """Test that learning outcome must belong to the course."""
        course1 = db_setup['course']
        program = db_setup['program']
        term = db_setup['term']

        # Create another course and LO
        course2 = Course.objects.create(
            code="TEST102",
            name="Another Course",
            credits=3,
            program=program,
            term=term
        )

        lo = LearningOutcome.objects.create(
            code="LO1",
            description="Learning outcome for course 2",
            course=course2
        )

        po = ProgramOutcome.objects.create(
            code="PO1",
            description="Program outcome",
            program=program,
            term=term
        )

        # Try to create mapping with LO from different course
        mapping = LearningOutcomeProgramOutcomeMapping(
            course=course1,
            learning_outcome=lo,
            program_outcome=po,
            weight=0.5
        )

        with pytest.raises(ValidationError):
            mapping.full_clean()


@pytest.mark.django_db
class TestStudentLearningOutcomeScore:
    """Tests for StudentLearningOutcomeScore model."""

    def test_create_student_lo_score(self, sample_course, student_factory):
        """Test creating student LO score."""
        lo = sample_course['learning_outcomes'][0]
        student = student_factory('student1')

        score = StudentLearningOutcomeScore.objects.create(
            student=student.user,
            learning_outcome=lo,
            score=85.5
        )

        assert score.student == student.user
        assert score.learning_outcome == lo
        assert score.score == 85.5
        assert "85.50" in str(score)

    def test_student_lo_score_unique_constraint(self, sample_course, student_factory):
        """Test that student LO score must be unique per student and LO."""
        lo = sample_course['learning_outcomes'][0]
        student = student_factory('student1')

        StudentLearningOutcomeScore.objects.create(
            student=student.user,
            learning_outcome=lo,
            score=75.0
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            StudentLearningOutcomeScore.objects.create(
                student=student.user,
                learning_outcome=lo,
                score=80.0
            )

    def test_student_lo_score_minimum_value(self, sample_course, student_factory):
        """Test that score must be >= 0."""
        lo = sample_course['learning_outcomes'][0]
        student = student_factory('student1')

        # Valid score
        score = StudentLearningOutcomeScore.objects.create(
            student=student.user,
            learning_outcome=lo,
            score=0.0
        )
        assert score.score == 0.0

        # Invalid score (< 0)
        with pytest.raises(ValidationError):
            score_invalid = StudentLearningOutcomeScore(
                student=student.user,
                learning_outcome=lo,
                score=-5.0
            )
            score_invalid.full_clean()


@pytest.mark.django_db
class TestStudentProgramOutcomeScore:
    """Tests for StudentProgramOutcomeScore model."""

    def test_create_student_po_score(self, db_setup, student_factory):
        """Test creating student PO score."""
        program = db_setup['program']
        term = db_setup['term']
        student = student_factory('student1')

        po = ProgramOutcome.objects.create(
            code="PO1",
            description="Engineering knowledge",
            program=program,
            term=term
        )

        score = StudentProgramOutcomeScore.objects.create(
            student=student.user,
            program_outcome=po,
            score=88.0,
            term=term
        )

        assert score.student == student.user
        assert score.program_outcome == po
        assert score.score == 88.0
        assert score.term == term
        assert "88.00" in str(score)

    def test_student_po_score_unique_constraint(self, db_setup, student_factory):
        """Test that student PO score must be unique per student, PO, and term."""
        program = db_setup['program']
        term = db_setup['term']
        student = student_factory('student1')

        po = ProgramOutcome.objects.create(
            code="PO1",
            description="Engineering knowledge",
            program=program,
            term=term
        )

        StudentProgramOutcomeScore.objects.create(
            student=student.user,
            program_outcome=po,
            score=80.0,
            term=term
        )

        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            StudentProgramOutcomeScore.objects.create(
                student=student.user,
                program_outcome=po,
                score=85.0,
                term=term
            )

    def test_student_po_score_minimum_value(self, db_setup, student_factory):
        """Test that score must be >= 0."""
        program = db_setup['program']
        term = db_setup['term']
        student = student_factory('student1')

        po = ProgramOutcome.objects.create(
            code="PO1",
            description="Engineering knowledge",
            program=program,
            term=term
        )

        # Valid score
        score = StudentProgramOutcomeScore.objects.create(
            student=student.user,
            program_outcome=po,
            score=0.0,
            term=term
        )
        assert score.score == 0.0

        # Invalid score (< 0)
        with pytest.raises(ValidationError):
            score_invalid = StudentProgramOutcomeScore(
                student=student.user,
                program_outcome=po,
                score=-10.0,
                term=term
            )
            score_invalid.full_clean()


@pytest.mark.django_db
class TestTimestampedModel:
    """Tests for TimeStampedModel abstract base class."""

    def test_timestamps_are_created(self, db_setup):
        """Test that created_at and updated_at are automatically set."""
        term = Term.objects.create(name="Spring 2025")
        assert term.created_at is not None
        assert term.updated_at is not None

    def test_updated_at_changes_on_save(self, db_setup):
        """Test that updated_at changes when model is saved."""
        term = Term.objects.create(name="Spring 2025")
        original_updated_at = term.updated_at

        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.01)

        term.name = "Spring 2026"
        term.save()

        term.refresh_from_db()
        assert term.updated_at > original_updated_at
