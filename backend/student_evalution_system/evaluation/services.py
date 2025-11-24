# evaluation/services.py
from django.db import transaction
from .models import (
    Assessment, AssessmentCOMatrix, StudentGrade, 
    StudentCOScore, CourseOutcome, StudentPOScore
)
from core.models import Course, CoursePOContribution

def calculate_course_scores(course_id):
    """
    1. Fetches all grades for the course.
    2. Calculates CO scores for every student.
    3. Calculates PO scores based on those CO scores.
    4. Stores them in the database (wiping old values for this course).
    """
    
    # 1. Setup: Fetch necessary data efficiently
    course = Course.objects.get(id=course_id)
    students = course.enrolled_students.all() # Assuming you have this M2M relation
    outcomes = CourseOutcome.objects.filter(course=course)
    
    # Get all weights for this course in one go
    # Dict format: {(assessment_id, co_id): weight}
    matrix_map = {} 
    for item in AssessmentCOMatrix.objects.filter(assessment__course=course):
        matrix_map[(item.assessment_id, item.course_outcome_id)] = item.weight

    # Get all grades
    # Dict format: {(student_id, assessment_id): score}
    grade_map = {}
    for grade in StudentGrade.objects.filter(assessment__course=course):
        grade_map[(grade.student_id, grade.assessment_id)] = grade.score

    # Prepare lists for bulk creation
    co_score_objects = []
    po_score_objects = []

    with transaction.atomic():
        # Step 2: Delete old calculations for this course (easiest way to handle updates)
        StudentCOScore.objects.filter(course_outcome__course=course).delete()
        StudentPOScore.objects.filter(course=course).delete()

        # Step 3: Loop through Students and Outcomes
        for student in students:
            # --- Calculate CO Scores ---
            student_co_values = {} # Store for the next step (PO calculation)

            for co in outcomes:
                total_score = 0
                total_weight = 0
                
                # Find all assessments that contribute to this CO
                assessments = Assessment.objects.filter(course=course)
                
                for assessment in assessments:
                    weight = matrix_map.get((assessment.id, co.id), 0)
                    if weight > 0:
                        score = grade_map.get((student.id, assessment.id), 0)
                        total_score += score * weight
                        total_weight += weight
                
                # Avoid division by zero
                final_co_score = (total_score / total_weight) if total_weight > 0 else 0
                
                # Prepare object
                co_score_objects.append(StudentCOScore(
                    student=student,
                    course_outcome=co,
                    score=final_co_score
                ))
                
                # Keep in memory for PO step
                student_co_values[co.id] = final_co_score

            # --- Calculate PO Scores (The Aggregation) ---
            # Find which POs this course contributes to
            po_contributions = CoursePOContribution.objects.filter(course=course)
            
            # Group contributions by PO
            # e.g. {PO1: [Contribution_Object_A, Contribution_Object_B]}
            po_map = {} 
            for contrib in po_contributions:
                if contrib.program_outcome not in po_map:
                    po_map[contrib.program_outcome] = []
                po_map[contrib.program_outcome].append(contrib)

            for po, contributions in po_map.items():
                weighted_sum = 0
                weight_sum = 0
                
                for contrib in contributions:
                    # Get the student's score for the relevant CO (from memory)
                    co_score = student_co_values.get(contrib.course.outcomes.get(pk=contrib.course_outcome_id).id, 0)
                    
                    # Formula: CO Score * Contribution Level (1-5)
                    weighted_sum += co_score * contrib.contribution_level
                    weight_sum += contrib.contribution_level
                
                final_po_score = (weighted_sum / weight_sum) if weight_sum > 0 else 0
                
                po_score_objects.append(StudentPOScore(
                    student=student,
                    course=course,
                    program_outcome=po,
                    score=final_po_score
                ))

        # Step 4: Bulk Save to Database
        StudentCOScore.objects.bulk_create(co_score_objects)
        StudentPOScore.objects.bulk_create(po_score_objects)