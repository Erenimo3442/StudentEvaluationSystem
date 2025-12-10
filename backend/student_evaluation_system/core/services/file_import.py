"""
File Import Service for Student Evaluation System

This service handles server-side processing of various file formats for bulk data import.
It validates file format, parses data, and creates database records.

Supported import types:
- Students
- Courses
- Assessments
- Student Grades
- Learning Outcomes
- Program Outcomes

Supported file formats:
- Excel (.xlsx, .xls) - Current implementation
- CSV (.csv) - Future extension
- JSON (.json) - Future extension
"""

import pandas as pd
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError as DRFValidationError
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

from ..models import (
    University, Department, Program, Term, Course, 
    LearningOutcome, ProgramOutcome, LearningOutcomeProgramOutcomeMapping
)
from evaluation.models import (
    Assessment, AssessmentLearningOutcomeMapping, 
    StudentGrade, CourseEnrollment
)

User = get_user_model()
logger = logging.getLogger(__name__)


class FileImportError(Exception):
    """Custom exception for file import errors."""
    pass


class FileParser(ABC):
    """
    Abstract base class for file parsers.
    
    This allows for modular extension to support different file formats.
    Each parser implements specific logic for reading its file type.
    """
    
    @abstractmethod
    def validate_file(self, file_obj) -> bool:
        """
        Validate if the file can be parsed by this parser.
        
        Args:
            file_obj: Uploaded file object
            
        Returns:
            bool: True if file is valid for this parser
        """
        pass
    
    @abstractmethod
    def get_sheet_names(self, file_obj) -> List[str]:
        """
        Get list of available sheets/data sections in the file.
        
        Args:
            file_obj: Uploaded file object
            
        Returns:
            List[str]: Available sheet/section names
        """
        pass
    
    @abstractmethod
    def parse_sheet(self, file_obj, sheet_name: str) -> pd.DataFrame:
        """
        Parse a specific sheet/section from the file.
        
        Args:
            file_obj: Uploaded file object
            sheet_name (str): Name of sheet/section to parse
            
        Returns:
            pd.DataFrame: Parsed data
        """
        pass


class ExcelParser(FileParser):
    """Parser for Excel files (.xlsx, .xls)."""
    
    def validate_file(self, file_obj) -> bool:
        """Validate Excel file format."""
        if not file_obj.name.endswith(('.xlsx', '.xls')):
            raise FileImportError("File must be an Excel file (.xlsx or .xls)")
        
        if file_obj.size > 10 * 1024 * 1024 * 5:  # 50MB limit
            raise FileImportError("File size must be less than 50MB")
        
        return True
    
    def get_sheet_names(self, file_obj) -> List[str]:
        """Get Excel sheet names."""
        try:
            workbook = pd.ExcelFile(file_obj)
            return workbook.sheet_names
        except Exception as e:
            raise FileImportError(f"Error reading Excel file: {str(e)}")
    
    def parse_sheet(self, file_obj, sheet_name: str) -> pd.DataFrame:
        """Parse Excel sheet into DataFrame."""
        try:
            workbook = pd.ExcelFile(file_obj)
            return pd.read_excel(workbook, sheet_name=sheet_name)
        except Exception as e:
            raise FileImportError(f"Error parsing sheet '{sheet_name}': {str(e)}")


class CSVParser(FileParser):
    """Parser for CSV files - Future implementation."""
    
    def validate_file(self, file_obj) -> bool:
        """Validate CSV file format."""
        if not file_obj.name.endswith('.csv'):
            raise FileImportError("File must be a CSV file (.csv)")
        
        if file_obj.size > 10 * 1024 * 1024:  # 10MB limit
            raise FileImportError("File size must be less than 10MB")
        
        return True
    
    def get_sheet_names(self, file_obj) -> List[str]:
        """CSV files have single sheet."""
        return ['data']
    
    def parse_sheet(self, file_obj, sheet_name: str) -> pd.DataFrame:
        """Parse CSV into DataFrame."""
        try:
            return pd.read_csv(file_obj)
        except Exception as e:
            raise FileImportError(f"Error parsing CSV file: {str(e)}")


class FileImportService:
    """
    Main service for handling file imports.
    
    This service coordinates file parsing, validation, and database operations.
    It uses a modular parser system to support multiple file formats.
    """
    
    # Expected column mappings for different data types
    REQUIRED_COLUMNS = {
        'students': ['username', 'email', 'first_name', 'last_name', 'student_id'],
        'courses': ['code', 'name', 'credits', 'program_code', 'term_name'],
        'assessments': ['name', 'course_code', 'assessment_type', 'total_score', 'weight'],
        'grades': ['student_id', 'assessment_name', 'score'],
        'learning_outcomes': ['code', 'description', 'course_code'],
        'program_outcomes': ['code', 'description', 'program_code', 'term_name']
    }
    
    # Available parsers for different file formats
    PARSERS = {
        'excel': ExcelParser,
        'csv': CSVParser,
    }
    
    def __init__(self, file_obj):
        """
        Initialize the service with an uploaded file.
        
        Args:
            file_obj: Uploaded file object containing data
        """
        self.file_obj = file_obj
        self.parser = None
        self.import_results = {
            'created': {},
            'updated': {},
            'errors': []
        }
    
    def detect_file_format(self) -> str:
        """
        Detect the file format and return appropriate parser name.
        
        Returns:
            str: Parser name ('excel', 'csv', etc.)
        """
        file_extension = self.file_obj.name.lower().split('.')[-1]
        
        if file_extension in ['xlsx', 'xls']:
            return 'excel'
        elif file_extension == 'csv':
            return 'csv'
        else:
            raise FileImportError(f"Unsupported file format: {file_extension}")
    
    def validate_file(self):
        """
        Validate the uploaded file format and structure.
        
        Returns:
            bool: True if file is valid
            
        Raises:
            FileImportError: If file format is invalid
        """
        try:
            # Detect file format
            parser_name = self.detect_file_format()
            
            # Get appropriate parser
            parser_class = self.PARSERS.get(parser_name)
            if not parser_class:
                raise FileImportError(f"No parser available for format: {parser_name}")
            
            self.parser = parser_class()
            
            # Validate file with parser
            return self.parser.validate_file(self.file_obj)
            
        except Exception as e:
            if isinstance(e, FileImportError):
                raise
            raise FileImportError(f"Invalid file: {str(e)}")
    
    def get_available_sheets(self) -> List[str]:
        """
        Get list of available sheets/sections in the file.
        
        Returns:
            List[str]: Available sheet/section names
        """
        if not self.parser:
            raise FileImportError("File not validated. Call validate_file() first.")
        
        return self.parser.get_sheet_names(self.file_obj)
    
    def import_students(self, sheet_name='students'):
        """
        Import student data from file sheet/section.
        
        Args:
            sheet_name (str): Name of the sheet/section containing student data
            
        Returns:
            dict: Import results with created/updated counts
        """
        try:
            df = self.parser.parse_sheet(self.file_obj, sheet_name)
            
            # Validate required columns
            self._validate_required_columns(df, 'students')
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for _, row in df.iterrows():
                    try:
                        # Clean data
                        username = str(row['username']).strip().lower()
                        email = str(row['email']).strip().lower()
                        first_name = str(row['first_name']).strip()
                        last_name = str(row['last_name']).strip()
                        student_id = str(row['student_id']).strip()
                        
                        # Get or create user
                        user, created = User.objects.get_or_create(
                            username=username,
                            defaults={
                                'email': email,
                                'first_name': first_name,
                                'last_name': last_name,
                                'role': 'student'
                            }
                        )
                        
                        if not created:
                            # Update existing user
                            user.email = email
                            user.first_name = first_name
                            user.last_name = last_name
                            user.save()
                            updated_count += 1
                        else:
                            created_count += 1
                        
                        # Create student profile if not exists
                        from users.models import StudentProfile
                        StudentProfile.objects.get_or_create(
                            user=user,
                            defaults={'student_id': student_id}
                        )
                        
                    except Exception as e:
                        self.import_results['errors'].append(
                            f"Error importing student {row.get('username', 'unknown')}: {str(e)}"
                        )
                        continue
            
            self.import_results['created']['students'] = created_count
            self.import_results['updated']['students'] = updated_count
            
            return self.import_results
            
        except Exception as e:
            raise FileImportError(f"Error importing students: {str(e)}")
    
    def import_courses(self, sheet_name='courses'):
        """
        Import course data from file sheet/section.
        
        Args:
            sheet_name (str): Name of the sheet/section containing course data
            
        Returns:
            dict: Import results with created/updated counts
        """
        try:
            df = self.parser.parse_sheet(self.file_obj, sheet_name)
            
            # Validate required columns
            self._validate_required_columns(df, 'courses')
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for _, row in df.iterrows():
                    try:
                        # Get related objects
                        program = self._get_program_by_code(str(row['program_code']).strip())
                        term = self._get_term_by_name(str(row['term_name']).strip())
                        
                        # Clean data
                        code = str(row['code']).strip().upper()
                        name = str(row['name']).strip()
                        credits = int(row['credits'])
                        
                        # Create or update course
                        course, created = Course.objects.get_or_create(
                            code=code,
                            program=program,
                            term=term,
                            defaults={
                                'name': name,
                                'credits': credits
                            }
                        )
                        
                        if not created:
                            # Update existing course
                            course.name = name
                            course.credits = credits
                            course.save()
                            updated_count += 1
                        else:
                            created_count += 1
                            
                    except Exception as e:
                        self.import_results['errors'].append(
                            f"Error importing course {row.get('code', 'unknown')}: {str(e)}"
                        )
                        continue
            
            self.import_results['created']['courses'] = created_count
            self.import_results['updated']['courses'] = updated_count
            
            return self.import_results
            
        except Exception as e:
            raise FileImportError(f"Error importing courses: {str(e)}")
    
    def import_assessments(self, sheet_name='assessments'):
        """
        Import assessment data from file sheet/section.
        
        Args:
            sheet_name (str): Name of the sheet/section containing assessment data
            
        Returns:
            dict: Import results with created/updated counts
        """
        try:
            df = self.parser.parse_sheet(self.file_obj, sheet_name)
            
            # Validate required columns
            self._validate_required_columns(df, 'assessments')
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for _, row in df.iterrows():
                    try:
                        # Get course
                        course = self._get_course_by_code(str(row['course_code']).strip())
                        
                        # Clean data
                        name = str(row['name']).strip()
                        assessment_type = str(row['assessment_type']).strip().lower()
                        total_score = float(row['total_score'])
                        weight = float(row['weight'])
                        
                        # Validate assessment type
                        valid_types = [choice[0] for choice in Assessment.ASSESSMENT_TYPES]
                        if assessment_type not in valid_types:
                            raise ValidationError(f"Invalid assessment type: {assessment_type}")
                        
                        # Create or update assessment
                        assessment, created = Assessment.objects.get_or_create(
                            name=name,
                            course=course,
                            defaults={
                                'assessment_type': assessment_type,
                                'total_score': total_score,
                                'weight': weight
                            }
                        )
                        
                        if not created:
                            # Update existing assessment
                            assessment.assessment_type = assessment_type
                            assessment.total_score = total_score
                            assessment.weight = weight
                            assessment.save()
                            updated_count += 1
                        else:
                            created_count += 1
                            
                    except Exception as e:
                        self.import_results['errors'].append(
                            f"Error importing assessment {row.get('name', 'unknown')}: {str(e)}"
                        )
                        continue
            
            self.import_results['created']['assessments'] = created_count
            self.import_results['updated']['assessments'] = updated_count
            
            return self.import_results
            
        except Exception as e:
            raise FileImportError(f"Error importing assessments: {str(e)}")
    
    def import_grades(self, sheet_name='grades'):
        """
        Import student grade data from file sheet/section.
        
        Args:
            sheet_name (str): Name of the sheet/section containing grade data
            
        Returns:
            dict: Import results with created/updated counts
        """
        try:
            df = self.parser.parse_sheet(self.file_obj, sheet_name)
            
            # Validate required columns
            self._validate_required_columns(df, 'grades')
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for _, row in df.iterrows():
                    try:
                        # Get related objects
                        student_user = self._get_student_by_id(str(row['student_id']).strip())
                        assessment = self._get_assessment_by_name(str(row['assessment_name']).strip())
                        
                        # Clean data
                        score = float(row['score'])
                        
                        # Validate score
                        if score > assessment.total_score:
                            raise ValidationError(f"Score {score} exceeds assessment total {assessment.total_score}")
                        
                        # Create or update grade
                        grade, created = StudentGrade.objects.get_or_create(
                            student=student_user,
                            assessment=assessment,
                            defaults={'score': score}
                        )
                        
                        if not created:
                            # Update existing grade
                            grade.score = score
                            grade.save()
                            updated_count += 1
                        else:
                            created_count += 1
                            
                    except Exception as e:
                        self.import_results['errors'].append(
                            f"Error importing grade for {row.get('student_id', 'unknown')}: {str(e)}"
                        )
                        continue
            
            self.import_results['created']['grades'] = created_count
            self.import_results['updated']['grades'] = updated_count
            
            return self.import_results
            
        except Exception as e:
            raise FileImportError(f"Error importing grades: {str(e)}")
    
    def import_learning_outcomes(self, sheet_name='learning_outcomes'):
        """
        Import learning outcome data from file sheet/section.
        
        Args:
            sheet_name (str): Name of the sheet/section containing learning outcome data
            
        Returns:
            dict: Import results with created/updated counts
        """
        try:
            df = self.parser.parse_sheet(self.file_obj, sheet_name)
            
            # Validate required columns
            self._validate_required_columns(df, 'learning_outcomes')
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for _, row in df.iterrows():
                    try:
                        # Get course
                        course = self._get_course_by_code(str(row['course_code']).strip())
                        
                        # Clean data
                        code = str(row['code']).strip().upper()
                        description = str(row['description']).strip()
                        
                        # Create or update learning outcome
                        lo, created = LearningOutcome.objects.get_or_create(
                            code=code,
                            course=course,
                            defaults={'description': description}
                        )
                        
                        if not created:
                            # Update existing learning outcome
                            lo.description = description
                            lo.save()
                            updated_count += 1
                        else:
                            created_count += 1
                            
                    except Exception as e:
                        self.import_results['errors'].append(
                            f"Error importing learning outcome {row.get('code', 'unknown')}: {str(e)}"
                        )
                        continue
            
            self.import_results['created']['learning_outcomes'] = created_count
            self.import_results['updated']['learning_outcomes'] = updated_count
            
            return self.import_results
            
        except Exception as e:
            raise FileImportError(f"Error importing learning outcomes: {str(e)}")
    
    def import_program_outcomes(self, sheet_name='program_outcomes'):
        """
        Import program outcome data from file sheet/section.
        
        Args:
            sheet_name (str): Name of the sheet/section containing program outcome data
            
        Returns:
            dict: Import results with created/updated counts
        """
        try:
            df = self.parser.parse_sheet(self.file_obj, sheet_name)
            
            # Validate required columns
            self._validate_required_columns(df, 'program_outcomes')
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for _, row in df.iterrows():
                    try:
                        # Get related objects
                        program = self._get_program_by_code(str(row['program_code']).strip())
                        term = self._get_term_by_name(str(row['term_name']).strip())
                        
                        # Clean data
                        code = str(row['code']).strip().upper()
                        description = str(row['description']).strip()
                        
                        # Create or update program outcome
                        po, created = ProgramOutcome.objects.get_or_create(
                            code=code,
                            program=program,
                            term=term,
                            defaults={'description': description}
                        )
                        
                        if not created:
                            # Update existing program outcome
                            po.description = description
                            po.save()
                            updated_count += 1
                        else:
                            created_count += 1
                            
                    except Exception as e:
                        self.import_results['errors'].append(
                            f"Error importing program outcome {row.get('code', 'unknown')}: {str(e)}"
                        )
                        continue
            
            self.import_results['created']['program_outcomes'] = created_count
            self.import_results['updated']['program_outcomes'] = updated_count
            
            return self.import_results
            
        except Exception as e:
            raise FileImportError(f"Error importing program outcomes: {str(e)}")
    
    def _validate_required_columns(self, dataframe: pd.DataFrame, sheet_type: str):
        """
        Validate that all required columns are present in the dataframe.
        
        Args:
            dataframe (pd.DataFrame): Data to validate
            sheet_type (str): Type of sheet to validate against
            
        Raises:
            FileImportError: If required columns are missing
        """
        required = self.REQUIRED_COLUMNS.get(sheet_type, [])
        missing = [col for col in required if col not in dataframe.columns]
        
        if missing:
            raise FileImportError(
                f"Missing required columns in {sheet_type} sheet: {', '.join(missing)}"
            )
    
    def _get_program_by_code(self, code: str):
        """Get program by code, raise error if not found."""
        try:
            return Program.objects.get(code=code)
        except Program.DoesNotExist:
            raise FileImportError(f"Program with code '{code}' not found")
    
    def _get_term_by_name(self, name: str):
        """Get term by name, create if doesn't exist."""
        term, created = Term.objects.get_or_create(
            name=name,
            defaults={'is_active': False}
        )
        return term
    
    def _get_course_by_code(self, code: str):
        """Get course by code, raise error if not found."""
        try:
            return Course.objects.get(code=code)
        except Course.DoesNotExist:
            raise FileImportError(f"Course with code '{code}' not found")
    
    def _get_student_by_id(self, student_id: str):
        """Get student user by student_id, raise error if not found."""
        try:
            from users.models import StudentProfile
            student_profile = StudentProfile.objects.select_related('user').get(student_id=student_id)
            return student_profile.user
        except StudentProfile.DoesNotExist:
            raise FileImportError(f"Student with ID '{student_id}' not found")
    
    def _get_assessment_by_name(self, name: str):
        """Get assessment by name, raise error if not found."""
        try:
            return Assessment.objects.get(name=name)
        except Assessment.DoesNotExist:
            raise FileImportError(f"Assessment with name '{name}' not found")
    
    def get_import_summary(self) -> Dict[str, Any]:
        """
        Get summary of import operations.
        
        Returns:
            dict: Summary with counts and errors
        """
        return self.import_results
