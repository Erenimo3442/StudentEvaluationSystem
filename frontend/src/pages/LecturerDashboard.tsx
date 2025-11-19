import React from 'react'

const LecturerDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">Lecturer Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">My Courses</h3>
            <p className="text-3xl font-bold text-primary-600">3</p>
            <p className="text-sm text-secondary-600">Active courses</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-primary-600">87</p>
            <p className="text-sm text-secondary-600">Across all courses</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Pending Reviews</h3>
            <p className="text-3xl font-bold text-orange-600">24</p>
            <p className="text-sm text-secondary-600">Submissions to grade</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Average Performance</h3>
            <p className="text-3xl font-bold text-green-600">82%</p>
            <p className="text-sm text-secondary-600">Course average</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">My Courses</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">CS101 - Introduction to Programming</p>
                <p className="text-sm text-secondary-600">32 students • 3 pending assignments</p>
              </div>
              <button className="btn-primary text-sm">View</button>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">CS201 - Data Structures</p>
                <p className="text-sm text-secondary-600">28 students • 5 pending assignments</p>
              </div>
              <button className="btn-primary text-sm">View</button>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded">
              <div>
                <p className="font-medium">CS301 - Web Development</p>
                <p className="text-sm text-secondary-600">27 students • 2 pending assignments</p>
              </div>
              <button className="btn-primary text-sm">View</button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded border-l-4 border-green-400">
              <div>
                <p className="font-medium">New submissions received</p>
                <p className="text-sm text-secondary-600">Programming Assignment 3 - 8 submissions</p>
              </div>
              <span className="text-green-600 text-sm">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <div>
                <p className="font-medium">Assignment created</p>
                <p className="text-sm text-secondary-600">Web Development Project - CS301</p>
              </div>
              <span className="text-blue-600 text-sm">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LecturerDashboard
