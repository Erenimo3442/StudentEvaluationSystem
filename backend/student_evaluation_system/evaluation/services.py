# evaluation/services.py
from django.db import transaction
from .models import Assessment, AssessmentLearningOutcomeMapping, StudentGrade
from core.models import (
    Course, LearningOutcome, 
    StudentLearningOutcomeScore, StudentProgramOutcomeScore,
    LearningOutcomeProgramOutcomeMapping
)

def calculate_course_scores(course_id):
    """
    1. Fetches all grades for the course.
    2. Calculates LO scores for every student.
    3. Calculates PO scores based on those LO scores.
    4. Stores them in the database (wiping old values for this course).
    """
    
    # 1. Setup: Fetch necessary data efficiently
    course = Course.objects.get(id=course_id)
    students = course.enrollments.all().select_related('student')  # Using related_name
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

    # Prepare lists for bulk creation
    lo_score_objects = []
    po_score_objects = []

    with transaction.atomic():
        # Step 2: Delete old calculations for this course (easiest way to handle updates)
        StudentLearningOutcomeScore.objects.filter(learning_outcome__course=course).delete()
        StudentProgramOutcomeScore.objects.filter(course=course).delete()

        # Step 3: Loop through Students and Learning Outcomes
        for enrollment in students:
            student = enrollment.student
            # --- Calculate LO Scores ---
            student_lo_values = {} # Store for the next step (PO calculation)

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
                
                # Keep in memory for PO step
                student_lo_values[lo.id] = final_lo_score

            # --- Calculate PO Scores (The Aggregation) ---
            # Find which POs this course contributes to
            po_contributions = LearningOutcomeProgramOutcomeMapping.objects.filter(course=course)
            
            # Group contributions by PO
            # e.g. {PO1: [Mapping_Object_A, Mapping_Object_B]}
            po_map = {} 
            for contrib in po_contributions:
                if contrib.program_outcome not in po_map:
                    po_map[contrib.program_outcome] = []
                po_map[contrib.program_outcome].append(contrib)

            for po, contributions in po_map.items():
                weighted_sum = 0
                weight_sum = 0
                
                for contrib in contributions:
                    # Get the student's score for the relevant LO (from memory)
                    lo_score = student_lo_values.get(contrib.learning_outcome_id, 0)
                    
                    # Formula: LO Score * Weight Percentage
                    weighted_sum += lo_score * contrib.weight_percentage
                    weight_sum += contrib.weight_percentage
                
                final_po_score = (weighted_sum / weight_sum) if weight_sum > 0 else 0
                
                po_score_objects.append(StudentProgramOutcomeScore(
                    student=student,
                    course=course,
                    program_outcome=po,
                    score=final_po_score
                ))

        # Step 4: Bulk Save to Database
        StudentLearningOutcomeScore.objects.bulk_create(lo_score_objects)
        StudentProgramOutcomeScore.objects.bulk_create(po_score_objects)