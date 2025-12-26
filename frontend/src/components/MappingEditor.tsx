import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card } from './ui/Card'
import {
  XMarkIcon,
  LinkIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import api from '../services/api'

// Types
interface Assessment {
  id: number
  name: string
  assessment_type: string
  weight: number
}

interface LearningOutcome {
  id: number
  code: string
  description: string
}

interface ProgramOutcome {
  id: number
  code: string
  description: string
}

interface AssessmentLOMapping {
  id?: number
  assessment: number
  learning_outcome: number | LearningOutcome
  weight: number
}

interface LOPOMapping {
  id?: number
  course: number
  learning_outcome: number | LearningOutcome
  program_outcome: number | ProgramOutcome
  weight: number
}

interface MappingEditorProps {
  courseId: number
  onClose?: () => void
}

// Draggable Item Component
const DraggableItem = ({
  id,
  type,
  children,
  data,
}: {
  id: string
  type: 'assessment' | 'lo' | 'po'
  children: React.ReactNode
  data: any
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type, ...data },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  )
}

// Droppable Zone Component
const DroppableZone = ({
  id,
  accepts,
  children,
  className = '',
}: {
  id: string
  accepts: string[]
  children: React.ReactNode
  className?: string
}) => {
  const { isOver, setNodeRef, active } = useDroppable({
    id,
    data: { accepts },
  })

  const canDrop = active?.data?.current?.type && accepts.includes(active.data.current.type)

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver && canDrop ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}
    >
      {children}
    </div>
  )
}

// Weight Input Modal
const WeightModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  fromLabel,
  toLabel,
  maxWeight = 1,
  usedWeight = 0,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (weight: number) => void
  title: string
  fromLabel: string
  toLabel: string
  maxWeight?: number
  usedWeight?: number
}) => {
  // Fix floating point precision issues by rounding to 2 decimal places
  const remainingWeight = Math.round(Math.max(0, maxWeight - usedWeight) * 100) / 100
  const [weight, setWeight] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // Clamp max to proper step value (round to nearest 0.05)
  const maxSliderValue = Math.round(remainingWeight / 0.05) * 0.05

  // Reset weight when modal opens with new remaining weight
  useEffect(() => {
    if (isOpen && !isInitialized) {
      // Set initial weight to half of remaining, rounded to step
      const initialWeight = Math.min(0.5, maxSliderValue)
      const roundedWeight = Math.round(initialWeight / 0.05) * 0.05
      setWeight(roundedWeight)
      setIsInitialized(true)
    }
    if (!isOpen) {
      setIsInitialized(false)
    }
  }, [isOpen, maxSliderValue, isInitialized])

  if (!isOpen) return null

  const isOverLimit = weight > remainingWeight

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{fromLabel}</span>
            <LinkIcon className="h-4 w-4" />
            <span className="font-medium">{toLabel}</span>
          </div>
          
          {/* Weight budget info */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Already allocated:</span>
              <span className="font-medium">{(usedWeight * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Remaining:</span>
              <span className={`font-medium ${remainingWeight <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(remainingWeight * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight for this mapping
            </label>
            <input
              id="weight-slider"
              type="range"
              min="0"
              max={maxSliderValue}
              step="0.05"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full"
              aria-label="Weight percentage"
              disabled={remainingWeight <= 0}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0%</span>
              <span className={`font-bold ${isOverLimit ? 'text-red-600' : 'text-primary-600'}`}>
                {(weight * 100).toFixed(0)}%
              </span>
              <span>{(maxSliderValue * 100).toFixed(0)}%</span>
            </div>
          </div>

          {remainingWeight <= 0 && (
            <p className="text-sm text-red-600">
              No remaining weight available. Total weight is already at 100%.
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(weight)}
              disabled={remainingWeight <= 0 || weight <= 0}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Component
const MappingEditor = ({ courseId, onClose }: MappingEditorProps) => {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([])
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([])
  const [assessmentLOMappings, setAssessmentLOMappings] = useState<AssessmentLOMapping[]>([])
  const [loPOMappings, setLoPOMappings] = useState<LOPOMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeData, setActiveData] = useState<any>(null)

  // Weight modal state
  const [weightModal, setWeightModal] = useState<{
    isOpen: boolean
    type: 'assessment-lo' | 'lo-po'
    fromId: number
    toId: number
    fromLabel: string
    toLabel: string
    usedWeight: number
  } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      console.log('MappingEditor: Fetching data for courseId:', courseId)
      try {
        const [assessmentsRes, losRes, posRes, aloMappingsRes, lopMappingsRes] = await Promise.all([
          api.get(`/api/evaluation/assessments/?course=${courseId}`),
          api.get(`/api/core/courses/${courseId}/learning_outcomes/`),
          api.get(`/api/core/program-outcomes/`),
          api.get(`/api/evaluation/assessment-lo-mappings/?course=${courseId}`),
          api.get(`/api/core/lo-po-mappings/?course=${courseId}`),
        ])

        console.log('MappingEditor API responses:', {
          assessments: assessmentsRes.data,
          los: losRes.data,
          pos: posRes.data,
        })

        setAssessments(assessmentsRes.data.results || assessmentsRes.data || [])
        setLearningOutcomes(losRes.data.results || losRes.data || [])
        setProgramOutcomes(posRes.data.results || posRes.data || [])
        setAssessmentLOMappings(aloMappingsRes.data.results || aloMappingsRes.data || [])
        setLoPOMappings(lopMappingsRes.data.results || lopMappingsRes.data || [])
      } catch (error) {
        console.error('Error fetching mapping data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setActiveData(event.active.data.current)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveData(null)

    if (!over) return

    const activeType = active.data.current?.type
    const overId = over.id as string

    // Assessment dropped on LO
    if (activeType === 'assessment' && overId.startsWith('lo-drop-')) {
      const loId = parseInt(overId.replace('lo-drop-', ''))
      const assessmentId = active.data.current?.id
      const assessment = assessments.find((a) => a.id === assessmentId)
      const lo = learningOutcomes.find((l) => l.id === loId)

      // Check if mapping already exists (learning_outcome can be object or id)
      const exists = assessmentLOMappings.some(
        (m) => m.assessment === assessmentId && 
          (typeof m.learning_outcome === 'object' 
            ? m.learning_outcome?.id === loId 
            : m.learning_outcome === loId)
      )
      if (exists) return

      // Calculate already used weight for this assessment
      const usedWeight = assessmentLOMappings
        .filter((m) => m.assessment === assessmentId)
        .reduce((sum, m) => sum + m.weight, 0)

      setWeightModal({
        isOpen: true,
        type: 'assessment-lo',
        fromId: assessmentId,
        toId: loId,
        fromLabel: assessment?.name || '',
        toLabel: lo?.code || '',
        usedWeight,
      })
    }

    // LO dropped on PO
    if (activeType === 'lo' && overId.startsWith('po-drop-')) {
      const poId = parseInt(overId.replace('po-drop-', ''))
      const loId = active.data.current?.id
      const lo = learningOutcomes.find((l) => l.id === loId)
      const po = programOutcomes.find((p) => p.id === poId)

      // Check if mapping already exists (learning_outcome and program_outcome can be object or id)
      const exists = loPOMappings.some(
        (m) => (typeof m.learning_outcome === 'object' 
                  ? m.learning_outcome?.id === loId 
                  : m.learning_outcome === loId) && 
               (typeof m.program_outcome === 'object' 
                  ? m.program_outcome?.id === poId 
                  : m.program_outcome === poId)
      )
      if (exists) return

      // Calculate already used weight for this LO
      const usedWeight = loPOMappings
        .filter((m) => 
          typeof m.learning_outcome === 'object' 
            ? m.learning_outcome?.id === loId 
            : m.learning_outcome === loId
        )
        .reduce((sum, m) => sum + m.weight, 0)

      setWeightModal({
        isOpen: true,
        type: 'lo-po',
        fromId: loId,
        toId: poId,
        fromLabel: lo?.code || '',
        toLabel: po?.code || '',
        usedWeight,
      })
    }

    setActiveId(null)
  }

  const handleCreateMapping = async (weight: number) => {
    if (!weightModal) return

    try {
      if (weightModal.type === 'assessment-lo') {
        const response = await api.post('/api/evaluation/assessment-lo-mappings/', {
          assessment_id: weightModal.fromId,
          learning_outcome_id: weightModal.toId,
          weight,
        })
        setAssessmentLOMappings([...assessmentLOMappings, response.data])
      } else {
        const response = await api.post('/api/core/lo-po-mappings/', {
          course: courseId,
          learning_outcome_id: weightModal.fromId,
          program_outcome_id: weightModal.toId,
          weight,
        })
        setLoPOMappings([...loPOMappings, response.data])
      }
    } catch (error: any) {
      console.error('Error creating mapping:', error)
      console.error('Error response data:', error.response?.data)
      
      // Show user-friendly error
      const errorMsg = error.response?.data?.non_field_errors?.[0] 
        || error.response?.data?.detail 
        || 'Failed to create mapping'
      alert(errorMsg)
    }

    setWeightModal(null)
  }

  const handleDeleteALOMapping = async (mappingId: number) => {
    try {
      await api.delete(`/api/evaluation/assessment-lo-mappings/${mappingId}/`)
      setAssessmentLOMappings(assessmentLOMappings.filter((m) => m.id !== mappingId))
    } catch (error) {
      console.error('Error deleting mapping:', error)
    }
  }

  const handleDeleteLOPOMapping = async (mappingId: number) => {
    try {
      await api.delete(`/api/core/lo-po-mappings/${mappingId}/`)
      setLoPOMappings(loPOMappings.filter((m) => m.id !== mappingId))
    } catch (error) {
      console.error('Error deleting mapping:', error)
    }
  }

  // Get mappings for a specific LO
  const getAssessmentMappingsForLO = (loId: number) => {
    return assessmentLOMappings.filter((m) => 
      typeof m.learning_outcome === 'object' 
        ? m.learning_outcome?.id === loId 
        : m.learning_outcome === loId
    )
  }

  const getPOMappingsForLO = (loId: number) => {
    return loPOMappings.filter((m) => 
      typeof m.learning_outcome === 'object' 
        ? m.learning_outcome?.id === loId 
        : m.learning_outcome === loId
    )
  }

  // Get LO mappings for a specific PO
  const getLOMappingsForPO = (poId: number) => {
    return loPOMappings.filter((m) => 
      typeof m.program_outcome === 'object' 
        ? m.program_outcome?.id === poId 
        : m.program_outcome === poId
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Outcome Mapping Editor</h2>
            <p className="text-gray-500 mt-1">
              Drag assessments to learning outcomes, and learning outcomes to program outcomes
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          )}
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Assessments Column */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardDocumentListIcon className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Assessments</h3>
            </div>
            <div className="space-y-2">
              {assessments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No assessments found</p>
              ) : (
                assessments.map((assessment) => (
                  <DraggableItem
                    key={assessment.id}
                    id={`assessment-${assessment.id}`}
                    type="assessment"
                    data={{ id: assessment.id, name: assessment.name }}
                  >
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                      <p className="font-medium text-blue-900">{assessment.name}</p>
                      <p className="text-xs text-blue-600 capitalize">
                        {assessment.assessment_type} • {(assessment.weight * 100).toFixed(0)}%
                      </p>
                    </div>
                  </DraggableItem>
                ))
              )}
            </div>
          </Card>

          {/* Learning Outcomes Column */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <AcademicCapIcon className="h-5 w-5 text-teal-600" />
              <h3 className="font-semibold text-gray-900">Learning Outcomes</h3>
            </div>
            <div className="space-y-3">
              {learningOutcomes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No learning outcomes found</p>
              ) : (
                learningOutcomes.map((lo) => (
                  <DroppableZone
                    key={lo.id}
                    id={`lo-drop-${lo.id}`}
                    accepts={['assessment']}
                    className="rounded-lg transition-all"
                  >
                    <DraggableItem
                      id={`lo-${lo.id}`}
                      type="lo"
                      data={{ id: lo.id, code: lo.code }}
                    >
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-sm font-bold">
                            {lo.code}
                          </span>
                        </div>
                        <p className="text-xs text-teal-700 line-clamp-2">{lo.description}</p>

                        {/* Linked Assessments */}
                        {getAssessmentMappingsForLO(lo.id).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-teal-200">
                            <p className="text-xs text-teal-600 mb-1">Linked Assessments:</p>
                            <div className="flex flex-wrap gap-1">
                              {getAssessmentMappingsForLO(lo.id).map((mapping) => {
                                const assessment = assessments.find(
                                  (a) => a.id === mapping.assessment
                                )
                                return (
                                  <span
                                    key={mapping.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                  >
                                    {assessment?.name?.substring(0, 15)}
                                    <span className="text-blue-500">
                                      ({(mapping.weight * 100).toFixed(0)}%)
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteALOMapping(mapping.id!)
                                      }}
                                      className="hover:text-red-600"
                                      title="Remove mapping"
                                      aria-label="Remove mapping"
                                    >
                                      <XMarkIcon className="h-3 w-3" />
                                    </button>
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Linked POs */}
                        {getPOMappingsForLO(lo.id).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-teal-200">
                            <p className="text-xs text-teal-600 mb-1">→ Program Outcomes:</p>
                            <div className="flex flex-wrap gap-1">
                              {getPOMappingsForLO(lo.id).map((mapping) => {
                                const poId = typeof mapping.program_outcome === 'object' 
                                  ? mapping.program_outcome?.id 
                                  : mapping.program_outcome
                                const po = programOutcomes.find((p) => p.id === poId)
                                return (
                                  <span
                                    key={mapping.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                                  >
                                    {po?.code}
                                    <span className="text-purple-500">
                                      ({(mapping.weight * 100).toFixed(0)}%)
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteLOPOMapping(mapping.id!)
                                      }}
                                      className="hover:text-red-600"
                                      title="Remove mapping"
                                      aria-label="Remove mapping"
                                    >
                                      <XMarkIcon className="h-3 w-3" />
                                    </button>
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </DraggableItem>
                  </DroppableZone>
                ))
              )}
            </div>
          </Card>

          {/* Program Outcomes Column */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Program Outcomes</h3>
            </div>
            <div className="space-y-2">
              {programOutcomes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No program outcomes found</p>
              ) : (
                programOutcomes.map((po) => (
                  <DroppableZone
                    key={po.id}
                    id={`po-drop-${po.id}`}
                    accepts={['lo']}
                    className="rounded-lg transition-all"
                  >
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-bold">
                          {po.code}
                        </span>
                      </div>
                      <p className="text-xs text-purple-700 mt-2 line-clamp-2">{po.description}</p>

                      {/* Linked Learning Outcomes */}
                      {getLOMappingsForPO(po.id).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <p className="text-xs text-purple-600 mb-1">Linked Learning Outcomes:</p>
                          <div className="flex flex-wrap gap-1">
                            {getLOMappingsForPO(po.id).map((mapping) => {
                              const loId = typeof mapping.learning_outcome === 'object'
                                ? mapping.learning_outcome?.id
                                : mapping.learning_outcome
                              const lo = learningOutcomes.find((l) => l.id === loId)
                              return (
                                <span
                                  key={mapping.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs"
                                >
                                  {lo?.code}
                                  <span className="text-teal-500">
                                    ({(mapping.weight * 100).toFixed(0)}%)
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteLOPOMapping(mapping.id!)
                                    }}
                                    className="hover:text-red-600"
                                    title="Remove mapping"
                                    aria-label="Remove mapping"
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </button>
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </DroppableZone>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Legend */}
        <Card className="p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              <span className="font-medium text-blue-600">1.</span> Drag an{' '}
              <span className="text-blue-600 font-medium">Assessment</span> and drop it on a{' '}
              <span className="text-teal-600 font-medium">Learning Outcome</span> to create a mapping
            </li>
            <li>
              <span className="font-medium text-teal-600">2.</span> Drag a{' '}
              <span className="text-teal-600 font-medium">Learning Outcome</span> and drop it on a{' '}
              <span className="text-purple-600 font-medium">Program Outcome</span> to create a mapping
            </li>
            <li>
              <span className="font-medium text-gray-600">3.</span> Click the{' '}
              <XMarkIcon className="h-3 w-3 inline" /> button on a mapping to remove it
            </li>
          </ul>
        </Card>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && activeData && (
          <div className="p-3 bg-white border-2 border-primary-500 rounded-lg shadow-lg">
            <p className="font-medium">{activeData.name || activeData.code}</p>
          </div>
        )}
      </DragOverlay>

      {/* Weight Modal */}
      {weightModal && (
        <WeightModal
          isOpen={weightModal.isOpen}
          onClose={() => setWeightModal(null)}
          onConfirm={handleCreateMapping}
          title={
            weightModal.type === 'assessment-lo'
              ? 'Link Assessment to Learning Outcome'
              : 'Link Learning Outcome to Program Outcome'
          }
          fromLabel={weightModal.fromLabel}
          toLabel={weightModal.toLabel}
          usedWeight={weightModal.usedWeight}
        />
      )}
    </DndContext>
  )
}

export default MappingEditor
