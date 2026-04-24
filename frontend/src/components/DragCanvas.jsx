import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, X } from 'lucide-react'
import useAppStore from '../store/useAppStore'

function SortableTab({ id, label, source, isActive, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-tab ${isActive ? 'canvas-tab--active' : ''}`}
      {...attributes}
    >
      <button
        className="canvas-tab__label"
        onClick={onSelect}
        {...listeners}
      >
        <span
          className="canvas-tab__dot"
          style={{ background: SOURCE_DOT[source] ?? '#6366f1' }}
        />
        <span>{label}</span>
      </button>
      <button
        className="canvas-tab__close icon-btn icon-btn--xs"
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        aria-label="Remove dataset"
      >
        <X size={11} />
      </button>
    </div>
  )
}

const SOURCE_DOT = {
  kaggle: '#20beff',
  worldbank: '#3b82f6',
  uci: '#8b5cf6',
  datagov: '#10b981',
  upload: '#f59e0b',
}

export default function DragCanvas({ isLoading }) {
  const {
    datasets,
    activeDatasetId,
    setActiveDataset,
    removeDataset,
    reorderDatasets,
  } = useAppStore()

  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop' })

  const handleSortEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = datasets.findIndex((d) => d.id === active.id)
    const newIndex = datasets.findIndex((d) => d.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderDatasets(arrayMove(datasets, oldIndex, newIndex).map((d) => d.id))
    }
  }

  const isEmpty = datasets.length === 0

  return (
    <div
      ref={setNodeRef}
      className={`drag-canvas ${isOver ? 'drag-canvas--over' : ''} ${
        isEmpty ? 'drag-canvas--empty' : ''
      }`}
    >
      {isEmpty ? (
        <AnimatePresence>
          <motion.div
            className="drag-canvas__empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Database size={40} className="drag-canvas__empty-icon" />
            </motion.div>
            <h3>Drop a dataset here</h3>
            <p>
              Drag any source card from the sidebar onto this canvas to load data.
              <br />
              You can load multiple datasets as tabs.
            </p>
            {isOver && (
              <motion.div
                className="drag-canvas__drop-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Release to load
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          {/* Tab bar */}
          <SortableContext
            items={datasets.map((d) => d.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="canvas-tabs">
              {datasets.map((ds) => (
                <SortableTab
                  key={ds.id}
                  id={ds.id}
                  label={ds.label}
                  source={ds.source}
                  isActive={ds.id === activeDatasetId}
                  onSelect={() => setActiveDataset(ds.id)}
                  onRemove={() => removeDataset(ds.id)}
                />
              ))}
            </div>
          </SortableContext>

          {/* Active dataset info bar */}
          <AnimatePresence mode="wait">
            {datasets.find((d) => d.id === activeDatasetId) && (
              <motion.div
                key={activeDatasetId}
                className="canvas-info-bar"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {(() => {
                  const ds = datasets.find((d) => d.id === activeDatasetId)
                  const [rows, cols] = ds.data.shape
                  return (
                    <>
                      <span className="canvas-info-bar__source">
                        {ds.source.toUpperCase()}
                      </span>
                      <span className="canvas-info-bar__name">{ds.label}</span>
                      <span className="canvas-info-bar__meta">
                        {rows.toLocaleString()} rows · {cols} columns
                      </span>
                    </>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drop-more hint when hovering over loaded canvas */}
          {isOver && (
            <motion.div
              className="drag-canvas__drop-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Add new dataset as tab
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
