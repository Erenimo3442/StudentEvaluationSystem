from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from users.models import StudentProfile

from .models import Assessment, AssessmentLearningOutcomeMapping, StudentGrade, CourseEnrollment
from core.models import (
    University, Department, Program, Term, Course, 
    LearningOutcome, ProgramOutcome, LearningOutcomeProgramOutcomeMapping,
    StudentLearningOutcomeScore, StudentProgramOutcomeScore, DegreeLevel
)
from .services import calculate_course_scores

User = get_user_model()


class ScoreRecalculationTestCase(TestCase):
    """Test that outcome scores are recalculated when student scores change."""
    
    def setUp(self):
        """Set up test data."""
        # Create university structure
        self.university = University.objects.create(name="Test University")
        self.department = Department.objects.create(
            name="Computer Science", 
            code="CS", 
            university=self.university
        )
        self.degree_level = DegreeLevel.objects.create(
            name="Bachelor's",
        )
        self.program = Program.objects.create(
            name="Computer Science BS",
            code="CS-BS",
            degree_level=self.degree_level,
            department=self.department
        )
        self.term = Term.objects.create(
            name="Fall 2025",
            is_active=True
        )
        
        # Create course
        self.course = Course.objects.create(
            code="CS101",
            name="Intro to Programming",
            program=self.program,
            term=self.term,
            credits=3
        )
        
        # Create learning outcomes
        self.lo1 = LearningOutcome.objects.create(
            code="LO1",
            description="Understand basic programming concepts",
            course=self.course
        )
        self.lo2 = LearningOutcome.objects.create(
            code="LO2",
            description="Write simple programs",
            course=self.course
        )
        
        # Create program outcome
        self.po1 = ProgramOutcome.objects.create(
            code="PO1",
            description="Problem solving skills",
            program=self.program,
            term=self.term
        )
        
        # Create LO-PO mapping
        LearningOutcomeProgramOutcomeMapping.objects.create(
            learning_outcome=self.lo1,
            program_outcome=self.po1,
            course=self.course,
            weight=0.5
        )
        LearningOutcomeProgramOutcomeMapping.objects.create(
            learning_outcome=self.lo2,
            program_outcome=self.po1,
            course=self.course,
            weight=0.5
        )
        
        # Create users
        self.instructor = User.objects.create_user(
            username="instructor",
            email="instructor@test.com",
            password="testpass123",
            role="instructor"
        )
        self.student = User.objects.create_user(
            username="student1",
            email="student1@test.com",
            password="testpass123",
            role="student"
        )
        
        # Enroll student
        self.enrollment = CourseEnrollment.objects.create(
            student=self.student,
            course=self.course
        )
        
        # Create assessments
        self.midterm = Assessment.objects.create(
            name="Midterm Exam",
            assessment_type="midterm",
            course=self.course,
            date="2025-10-15",
            total_score=100,
            weight=0.5,
            created_by=self.instructor
        )
        self.final = Assessment.objects.create(
            name="Final Exam",
            assessment_type="final",
            course=self.course,
            date="2025-12-15",
            total_score=100,
            weight=0.5,
            created_by=self.instructor
        )
        
        # Create assessment-LO mappings
        self.midterm_lo1_mapping = AssessmentLearningOutcomeMapping.objects.create(
            assessment=self.midterm,
            learning_outcome=self.lo1,
            weight=0.7
        )
        self.midterm_lo2_mapping = AssessmentLearningOutcomeMapping.objects.create(
            assessment=self.midterm,
            learning_outcome=self.lo2,
            weight=0.3
        )
        self.final_lo1_mapping = AssessmentLearningOutcomeMapping.objects.create(
            assessment=self.final,
            learning_outcome=self.lo1,
            weight=0.4
        )
        self.final_lo2_mapping = AssessmentLearningOutcomeMapping.objects.create(
            assessment=self.final,
            learning_outcome=self.lo2,
            weight=0.6
        )
        
        # Setup API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.instructor)
    
    def test_score_recalculation_on_grade_create(self):
        """Test that creating a grade triggers score recalculation."""
        # Initially no scores
        self.assertEqual(StudentLearningOutcomeScore.objects.count(), 0)
        
        # Create a grade via API
        response = self.client.post('/api/evaluation/grades/', {
            'student': self.student.id,
            'assessment': self.midterm.id,
            'score': 80
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify LO scores were created
        lo_scores = StudentLearningOutcomeScore.objects.filter(student=self.student)
        self.assertEqual(lo_scores.count(), 2)
        
        # Verify PO scores were created
        po_scores = StudentProgramOutcomeScore.objects.filter(student=self.student)
        self.assertEqual(po_scores.count(), 1)
    
    def test_score_recalculation_on_grade_update(self):
        """Test that updating a grade triggers score recalculation."""
        # Create initial grade
        grade = StudentGrade.objects.create(
            student=self.student,
            assessment=self.midterm,
            score=60
        )
        calculate_course_scores(self.course.id)
        
        # Get initial LO score
        initial_lo_score = StudentLearningOutcomeScore.objects.get(
            student=self.student,
            learning_outcome=self.lo1
        ).score
        
        # Update grade via API
        response = self.client.put(f'/api/evaluation/grades/{grade.id}/', {
            'student': self.student.id,
            'assessment': self.midterm.id,
            'score': 90
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify LO score was updated
        updated_lo_score = StudentLearningOutcomeScore.objects.get(
            student=self.student,
            learning_outcome=self.lo1
        ).score
        
        self.assertNotEqual(initial_lo_score, updated_lo_score)
        self.assertGreater(updated_lo_score, initial_lo_score)
    
    def test_score_recalculation_on_grade_delete(self):
        """Test that deleting a grade triggers score recalculation."""
        # Create grades
        grade1 = StudentGrade.objects.create(
            student=self.student,
            assessment=self.midterm,
            score=80
        )
        StudentGrade.objects.create(
            student=self.student,
            assessment=self.final,
            score=90
        )
        calculate_course_scores(self.course.id)
        
        # Get initial LO score (should be based on both grades)
        initial_lo_score = StudentLearningOutcomeScore.objects.get(
            student=self.student,
            learning_outcome=self.lo1
        ).score
        
        # Delete first grade via API
        response = self.client.delete(f'/api/evaluation/grades/{grade1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify LO score was recalculated (should only be based on final now)
        updated_lo_score = StudentLearningOutcomeScore.objects.get(
            student=self.student,
            learning_outcome=self.lo1
        ).score
        
        self.assertNotEqual(initial_lo_score, updated_lo_score)
    
    def test_score_recalculation_on_assessment_weight_change(self):
        """Test that changing assessment weight triggers recalculation."""
        # Create grades
        StudentGrade.objects.create(student=self.student, assessment=self.midterm, score=60)
        StudentGrade.objects.create(student=self.student, assessment=self.final, score=100)
        calculate_course_scores(self.course.id)
        
        # Get initial score
        initial_lo_score = StudentLearningOutcomeScore.objects.get(
            student=self.student,
            learning_outcome=self.lo1
        ).score
        
        # Change assessment learning outcome weight (give final more weight)
        response = self.client.patch(f'/api/evaluation/assessment-lo-mappings/{self.midterm_lo1_mapping.id}/', {
            'weight': 0.3
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Update final weight to maintain sum = 1.0
        self.final_lo1_mapping.weight = 0.7
        self.final_lo1_mapping.save()
        
        # Manually recalculate since we updated final directly (bypassing API)
        calculate_course_scores(self.course.id)
        
        # Note: The API hook already recalculated scores when midterm weight changed
        # Verify score changed (final has higher weight now, so higher scores since final=100)
        updated_lo_score = StudentLearningOutcomeScore.objects.get(
            student=self.student,
            learning_outcome=self.lo1
        ).score
        
        # Score should be higher because we reduced midterm (60) weight and increased final (100) weight
        self.assertGreater(updated_lo_score, initial_lo_score)
    
    def test_score_recalculation_on_enrollment_delete(self):
        """Test that unenrolling a student removes their scores."""
        # Create grades and calculate scores
        StudentGrade.objects.create(student=self.student, assessment=self.midterm, score=80)
        calculate_course_scores(self.course.id)
        
        # Verify scores exist
        self.assertEqual(StudentLearningOutcomeScore.objects.filter(student=self.student).count(), 2)
        
        # Unenroll student via API
        response = self.client.delete(f'/api/evaluation/enrollments/{self.enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify scores were deleted for this course
        self.assertEqual(
            StudentLearningOutcomeScore.objects.filter(
                student=self.student,
                learning_outcome__course=self.course
            ).count(),
            0
        )
    
    def test_bulk_enrollment_triggers_recalculation(self):
        """Test that bulk enrollment triggers score calculation."""
        # Create another student
        student2 = User.objects.create_user(
            username="student2",
            email="student2@test.com",
            password="testpass123",
            role="student"
        )
        
        # Create grades for both students
        StudentGrade.objects.create(student=self.student, assessment=self.midterm, score=80)
        StudentGrade.objects.create(student=student2, assessment=self.midterm, score=70)
        
        # Bulk enroll (student2 is not enrolled yet)
        response = self.client.post('/api/evaluation/enrollments/bulk_enroll/', {
            'course_id': self.course.id,
            'student_ids': [student2.id]
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify scores were calculated for student2
        self.assertEqual(
            StudentLearningOutcomeScore.objects.filter(student=student2).count(),
            2
        )
    
    def test_lo_mapping_change_triggers_recalculation(self):
        """Test that changing LO mapping weights triggers recalculation."""
        # Create grade and calculate
        StudentGrade.objects.create(student=self.student, assessment=self.midterm, score=80)
        calculate_course_scores(self.course.id)
        
        # Get initial scores
        initial_lo1 = StudentLearningOutcomeScore.objects.get(
            student=self.student, learning_outcome=self.lo1
        ).score
        initial_lo2 = StudentLearningOutcomeScore.objects.get(
            student=self.student, learning_outcome=self.lo2
        ).score
        
        # Change LO mapping weight (flip the weights)
        mapping = AssessmentLearningOutcomeMapping.objects.get(
            assessment=self.midterm, learning_outcome=self.lo1
        )
        response = self.client.patch(
            f'/api/evaluation/assessment-lo-mappings/{mapping.id}/',
            {'weight': 0.3}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Update other mapping to maintain sum = 1.0
        mapping2 = AssessmentLearningOutcomeMapping.objects.get(
            assessment=self.midterm, learning_outcome=self.lo2
        )
        mapping2.weight = 0.7
        mapping2.save()
        calculate_course_scores(self.course.id)
        
        # Verify scores changed
        updated_lo1 = StudentLearningOutcomeScore.objects.get(
            student=self.student, learning_outcome=self.lo1
        ).score
        updated_lo2 = StudentLearningOutcomeScore.objects.get(
            student=self.student, learning_outcome=self.lo2
        ).score
        
        self.assertNotEqual(initial_lo1, updated_lo1)
        self.assertNotEqual(initial_lo2, updated_lo2)


class BulkImportRecalculationTestCase(TestCase):
    """Test that bulk grade imports trigger score recalculation."""
    
    def setUp(self):
        """Set up minimal test data."""
        # Create minimal structure (reuse setup logic)
        self.university = University.objects.create(name="Test University")
        self.department = Department.objects.create(
            name="CS", code="CS", university=self.university
        )
        self.degree_level = DegreeLevel.objects.create(
            name="Bachelor's",
        )
        self.program = Program.objects.create(
            name="CS BS", code="CS-BS", degree_level=self.degree_level, department=self.department
        )
        self.term = Term.objects.create(name="Fall 2025", is_active=True)
        self.course = Course.objects.create(
            code="CS101", name="Test Course", program=self.program, 
            term=self.term, credits=3
        )
        self.lo1 = LearningOutcome.objects.create(
            code="LO1", description="Test LO", course=self.course
        )
        self.instructor = User.objects.create_user(
            username="instructor", email="i@test.com", 
            password="pass", role="instructor"
        )
        self.student = User.objects.create_user(
            username="student", email="s@test.com",
            password="pass", role="student"
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student, student_id="S1001", enrollment_term=self.term, program=self.program
        )
        CourseEnrollment.objects.create(student=self.student, course=self.course)
        
        self.assessment = Assessment.objects.create(
            name="Test", assessment_type="midterm", course=self.course,
            date="2025-10-15", total_score=100, weight=1.0,
            created_by=self.instructor
        )
        AssessmentLearningOutcomeMapping.objects.create(
            assessment=self.assessment, learning_outcome=self.lo1, weight=1.0
        )
    
    def test_bulk_import_triggers_recalculation(self):
        """Test that importing grades via file triggers recalculation."""
        from core.services.file_import import FileImportService
        from io import BytesIO
        from django.core.files.uploadedfile import InMemoryUploadedFile
        import pandas as pd
        import sys
        
        # Create test Excel file in memory with Turkish format
        df = pd.DataFrame({
            'Öğrenci No': [self.student_profile.student_id],
            'Adı': ['Test'],
            'Soyadı': ['Student'],
            'Test': [85]
        })
        
        excel_buffer = BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Sheet1', index=False)


        uploaded_file = InMemoryUploadedFile(
            file=excel_buffer,
            field_name='file',
            name='test_grades.xlsx',
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size=sys.getsizeof(excel_buffer.getvalue()),
            charset=None
        )
        
        # Initially no scores
        self.assertEqual(StudentLearningOutcomeScore.objects.count(), 0)
        
        # Import grades
        importer = FileImportService(uploaded_file)
        importer.validate_file()

        result = importer.import_assignment_scores(
            course_code=self.course.code,
            term_id=self.term.id
        )
        
        # Verify import succeeded
        self.assertEqual(result['created']['grades'], 1)
        
        # Verify scores were calculated
        self.assertEqual(StudentLearningOutcomeScore.objects.count(), 1)
        score = StudentLearningOutcomeScore.objects.get(
            student=self.student, learning_outcome=self.lo1
        )
        self.assertEqual(score.score, 85.0)


def run_tests():
    """Helper function to run tests from command line."""
    import sys
    from django.core.management import execute_from_command_line
    
    sys.argv = ['manage.py', 'test', 'evaluation.tests', '--verbosity=2']
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    run_tests()
