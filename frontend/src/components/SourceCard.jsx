import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { CheckCircle2, Download, GripVertical } from 'lucide-react'

const SOURCE_COLORS = {
  kaggle: '#20beff',
  worldbank: '#3b82f6',
  uci: '#8b5cf6',
  datagov: '#10b981',
  upload: '#f59e0b',
}

export default function SourceCard({ source, dataset, label, isLoaded, onLoad }) {
  const dragId = `${source}|${dataset}`

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { source, dataset },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 999 : undefined,
  }

  const accentColor = SOURCE_COLORS[source] ?? '#6366f1'

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`source-card ${isLoaded ? 'source-card--loaded' : ''}`}
      whileHover={isDragging ? {} : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className="source-card__accent"
        style={{ background: accentColor }}
      />

      <div className="source-card__drag-handle" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </div>

      <div className="source-card__body">
        <div className="source-card__source-badge" style={{ color: accentColor }}>
          {source.toUpperCase()}
        </div>
        <div className="source-card__label">{label || dataset}</div>
      </div>

      <div className="source-card__actions">
        {isLoaded ? (
          <span className="source-card__loaded-badge">
            <CheckCircle2 size={13} /> Loaded
          </span>
        ) : (
          <button
            className="icon-btn icon-btn--sm"
            title="Load dataset"
            onClick={(e) => {
              e.stopPropagation()
              onLoad?.(source, dataset, label)
            }}
          >
            <Download size={14} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
