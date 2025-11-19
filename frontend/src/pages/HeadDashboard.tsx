import React from 'react'

const HeadDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">Department Head Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Total Programs</h3>
            <p className="text-3xl font-bold text-primary-600">3</p>
            <p className="text-sm text-secondary-600">Active programs</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Total Courses</h3>
            <p className="text-3xl font-bold text-primary-600">24</p>
            <p className="text-sm text-secondary-600">Across all programs</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-primary-600">342</p>
            <p className="text-sm text-secondary-600">Enrolled students</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Department Average</h3>
            <p className="text-3xl font-bold text-green-600">78%</p>
            <p className="text-sm text-secondary-600">Overall performance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Programs Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">Computer Science</p>
                <p className="text-sm text-secondary-600">156 students • 12 courses</p>
              </div>
              <span className="text-green-600 font-medium">82%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">Information Technology</p>
                <p className="text-sm text-secondary-600">124 students • 8 courses</p>
              </div>
              <span className="text-yellow-600 font-medium">76%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">Software Engineering</p>
                <p className="text-sm text-secondary-600">62 students • 4 courses</p>
              </div>
              <span className="text-green-600 font-medium">79%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <div>
                <p className="font-medium">New program approved</p>
                <p className="text-sm text-secondary-600">Data Science Program - CS Department</p>
              </div>
              <span className="text-blue-600 text-sm">2 days ago</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded border-l-4 border-green-400">
              <div>
                <p className="font-medium">Accreditation report submitted</p>
                <p className="text-sm text-secondary-600">ABET review for CS program</p>
              </div>
              <span className="text-green-600 text-sm">1 week ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeadDashboard
