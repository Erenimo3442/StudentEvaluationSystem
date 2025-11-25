# evaluation/services.py
from django.db import transaction
from .models import Assessment, AssessmentLearningOutcomeMapping, StudentGrade, CourseEnrollment
from core.models import (
    Course, LearningOutcome, 
    StudentLearningOutcomeScore, StudentProgramOutcomeScore,
    LearningOutcomeProgramOutcomeMapping
)

def calculate_course_scores(course_id):
    """
    1. Fetches all grades for the course.
    2. Calculates LO scores for every student enrolled in the course.
    3. Triggers program-level PO score calculation for affected students.
    4. Stores them in the database (wiping old LO values for this course).
    """
    
    # 1. Setup: Fetch necessary data efficiently
    course = Course.objects.select_related('program', 'term').get(id=course_id)
    enrollments = CourseEnrollment.objects.filter(course=course).select_related('student')
    learning_outcomes = LearningOutcome.objects.filter(course=course)
    
    # Get all weights for this course in one go
    # Dict format: {(assessment_id, lo_id): weight}
    matrix_map = {} 
    for item in AssessmentLearningOutcomeMapping.objects.filter(assessment__course=course):
        matrix_map[(item.assessment_id, item.learning_outcome_id)] = item.weight

    # Get all grades
    # Dict format: {(student_id, assessment_id): score}
    grade_map = {}
    for grade in StudentGrade.objects.filter(assessment__course=course):
        grade_map[(grade.student_id, grade.assessment_id)] = grade.score

    # Prepare list for bulk creation
    lo_score_objects = []
    affected_students = set()

    with transaction.atomic():
        # Step 2: Delete old LO calculations for this course
        StudentLearningOutcomeScore.objects.filter(learning_outcome__course=course).delete()

        # Step 3: Loop through Students and Learning Outcomes
        for enrollment in enrollments:
            student = enrollment.student
            affected_students.add(student.id)
            
            # --- Calculate LO Scores ---
            for lo in learning_outcomes:
                total_score = 0
                total_weight = 0
                
                # Find all assessments that contribute to this LO
                assessments = Assessment.objects.filter(course=course)
                
                for assessment in assessments:
                    weight = matrix_map.get((assessment.id, lo.id), 0)
                    if weight > 0:
                        score = grade_map.get((student.id, assessment.id), 0)
                        total_score += score * weight
                        total_weight += weight
                
                # Avoid division by zero
                final_lo_score = (total_score / total_weight) if total_weight > 0 else 0
                
                # Prepare object
                lo_score_objects.append(StudentLearningOutcomeScore(
                    student=student,
                    learning_outcome=lo,
                    score=final_lo_score
                ))

        # Step 4: Bulk Save LO Scores
        StudentLearningOutcomeScore.objects.bulk_create(lo_score_objects)
    
    # Step 5: Recalculate PO scores for all affected students in this program/term
    for student_id in affected_students:
        calculate_student_po_scores(student_id, course.program.id, course.term.id)


def calculate_student_po_scores(student_id, program_id, term_id):
    """
    Calculate Program Outcome scores for a student across ALL courses in their program for a given term.
    This aggregates LO scores from all courses the student is enrolled in.
    """
    from users.models import CustomUser
    
    student = CustomUser.objects.get(id=student_id)
    
    # Get all courses in this program for this term that the student is enrolled in
    enrolled_courses = Course.objects.filter(
        program_id=program_id,
        term_id=term_id,
        enrollments__student=student
    )
    
    # Get all program outcomes for this program and term
    from core.models import ProgramOutcome
    program_outcomes = ProgramOutcome.objects.filter(program_id=program_id, term_id=term_id)
    
    po_score_objects = []
    
    with transaction.atomic():
        # Delete old PO scores for this student in this program/term
        StudentProgramOutcomeScore.objects.filter(
            student=student,
            program_outcome__program_id=program_id,
            term_id=term_id
        ).delete()
        
        # For each PO, aggregate across all courses
        for po in program_outcomes:
            total_weighted_score = 0
            total_weight = 0
            
            # Find all LO->PO mappings for this PO across all enrolled courses
            mappings = LearningOutcomeProgramOutcomeMapping.objects.filter(
                program_outcome=po,
                course__in=enrolled_courses
            ).select_related('learning_outcome')
            
            for mapping in mappings:
                # Get the student's LO score
                try:
                    lo_score = StudentLearningOutcomeScore.objects.get(
                        student=student,
                        learning_outcome=mapping.learning_outcome
                    ).score
                except StudentLearningOutcomeScore.DoesNotExist:
                    lo_score = 0
                
                # Weighted contribution to PO
                total_weighted_score += lo_score * mapping.weight
                total_weight += mapping.weight
            
            # Calculate final PO score
            final_po_score = (total_weighted_score / total_weight) if total_weight > 0 else 0
            
            po_score_objects.append(StudentProgramOutcomeScore(
                student=student,
                program_outcome=po,
                term_id=term_id,
                score=final_po_score
            ))
        
        # Bulk save PO scores
        if po_score_objects:
            StudentProgramOutcomeScore.objects.bulk_create(po_score_objects)