import React, { useState } from 'react'
import { fileImportService } from '../services/api'

interface FileUploadProps {
  onUploadComplete?: (result: any) => void
  onError?: (error: string) => void
  course: string
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, onError, course }) => {
  const [file, setFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<string>('auto')
  const [sheetName, setSheetName] = useState<string>('')
  const [uploading, setUploading] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)
  const [uploadInfo, setUploadInfo] = useState<any>(null)

  React.useEffect(() => {
    // Load upload info when component mounts
    fileImportService.getUploadInfo().then(setUploadInfo).catch(console.error)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleValidate = async () => {
    if (!file) {
      onError?.('Please select a file first')
      return
    }

    setValidating(true)
    try {
      const result = await fileImportService.validateFile(file)
      console.log('Validation result:', result)
      // You could show the available sheets to the user here
    } catch (error: any) {
      onError?.(error.response?.data?.error || 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      onError?.('Please select a file first')
      return
    }

    setUploading(true)
    try {
      const result = await fileImportService.uploadFile(file, course)
      onUploadComplete?.(result)
      // Reset form after successful upload
      setFile(null)
      setSheetName('')
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error: any) {
      onError?.(error.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">File Import</h2>
      
      {uploadInfo && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Supported Import Types:</h3>
          <ul className="text-sm space-y-1">
            {uploadInfo.supported_import_types?.map((type: string, index: number) => (
              <li key={index}>• {type}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File (.xlsx, .xls, .csv)
          </label>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              Selected file: <span className="font-medium">{file.name}</span>
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import Type
          </label>
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="auto">Auto-detect</option>
            <option value="students">Students</option>
            <option value="courses">Courses</option>
            <option value="assessments">Assessments</option>
            <option value="grades">Grades</option>
            <option value="learning_outcomes">Learning Outcomes</option>
            <option value="program_outcomes">Program Outcomes</option>
          </select>
        </div>

        {importType !== 'auto' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sheet Name (optional)
            </label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder={`Default: ${importType}`}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleValidate}
            disabled={!file || validating}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? 'Validating...' : 'Validate File'}
          </button>
          
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload & Import'}
          </button>
        </div>
      </div>

      {uploadInfo && (
        <div className="mt-4 p-4 bg-gray-50 rounded text-xs">
          <h4 className="font-semibold mb-2">Example cURL command:</h4>
          <pre className="bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto">
            {uploadInfo.example_curl?.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}

export default FileUpload
