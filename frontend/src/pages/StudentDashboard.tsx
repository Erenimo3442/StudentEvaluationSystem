import React from 'react'

const StudentDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">Student Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Overall Progress</h3>
            <p className="text-3xl font-bold text-primary-600">85%</p>
            <p className="text-sm text-secondary-600">Program achievement</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Current Courses</h3>
            <p className="text-3xl font-bold text-primary-600">4</p>
            <p className="text-sm text-secondary-600">Active enrollments</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Pending Assignments</h3>
            <p className="text-3xl font-bold text-orange-600">3</p>
            <p className="text-sm text-secondary-600">Due this week</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Recent Submissions</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">Programming Assignment 3</p>
                <p className="text-sm text-secondary-600">CS101 - Introduction to Programming</p>
              </div>
              <span className="text-green-600 font-medium">92/100</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">Data Structures Quiz</p>
                <p className="text-sm text-secondary-600">CS201 - Data Structures</p>
              </div>
              <span className="text-green-600 font-medium">88/100</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Upcoming Assignments</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded border-l-4 border-orange-400">
              <div>
                <p className="font-medium">Web Development Project</p>
                <p className="text-sm text-secondary-600">CS301 - Web Development</p>
              </div>
              <span className="text-orange-600 font-medium">Due in 2 days</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">Algorithm Analysis</p>
                <p className="text-sm text-secondary-600">CS201 - Data Structures</p>
              </div>
              <span className="text-secondary-600 font-medium">Due in 5 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
