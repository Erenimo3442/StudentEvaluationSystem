import React from 'react'
import { useParams } from 'react-router-dom'

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">CS101 - Introduction to Programming</h1>
        <p className="text-secondary-600 mb-6">Fundamental concepts of programming and problem-solving</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Course Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary-600">Students:</span>
                <span className="font-medium">32</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Credits:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Lecturer:</span>
                <span className="font-medium">Dr. John Smith</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary-600">Average:</span>
                <span className="font-medium text-green-600">82%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Completion:</span>
                <span className="font-medium">94%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">On-time:</span>
                <span className="font-medium">87%</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Outcomes</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary-600">CO1 Achieved:</span>
                <span className="font-medium text-green-600">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">CO2 Achieved:</span>
                <span className="font-medium text-yellow-600">78%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">CO3 Achieved:</span>
                <span className="font-medium text-green-600">83%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Course Outcomes Performance</h2>
          <div className="bg-secondary-50 rounded-lg p-4">
            <p className="text-center text-secondary-600">Radar chart will be displayed here</p>
            <p className="text-center text-sm text-secondary-500">Showing average performance per course outcome</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Recent Assignments</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded border-l-4 border-green-400">
              <div>
                <p className="font-medium">Programming Assignment 3</p>
                <p className="text-sm text-secondary-600">30/32 submitted • Average: 88%</p>
              </div>
              <span className="text-green-600 text-sm">Completed</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <div>
                <p className="font-medium">Midterm Exam</p>
                <p className="text-sm text-secondary-600">32/32 submitted • Average: 79%</p>
              </div>
              <span className="text-yellow-600 text-sm">Grading</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <div>
                <p className="font-medium">Final Project</p>
                <p className="text-sm text-secondary-600">Due in 2 weeks</p>
              </div>
              <span className="text-blue-600 text-sm">Upcoming</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail
