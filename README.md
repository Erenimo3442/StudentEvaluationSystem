# Student Evaluation System

A comprehensive academic evaluation platform built with Django REST Framework and React. This system allows educational institutions to track student performance through weighted assessments and measure achievement against course and program outcomes.

## Features

- **Role-Based Access Control**: Guest, Student, Lecturer, and Head roles with specific permissions
- **Weighted Assessment System**: Calculate course scores from midterm, final, homework, project, and attendance
- **Outcome Mapping**: Link assessments to Course Outcomes (CO) and Program Outcomes (PO)
- **Analytics Dashboard**: Visual charts and insights for lecturers to monitor course performance
- **Spreadsheet Upload**: Bulk import grades via Excel/CSV files
- **Dynamic Weight Management**: Adjust assessment weights and see real-time impact

## Setup Instructions for Team Members

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- Git

### Backend Setup (Django)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Erenimo3442/StudentEvaluationSystem.git
   cd StudentEvaluationSystem
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows
   cd backend
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000/`

### Frontend Setup (React + Vite)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173/`

## Available Scripts

**Backend:**
- `python manage.py runserver` - Start Django development server
- `python manage.py test` - Run backend tests
- `python manage.py makemigrations` - Create database migrations
- `python manage.py migrate` - Apply database migrations

**Frontend:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`
