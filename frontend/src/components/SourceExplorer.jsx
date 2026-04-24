import { motion } from 'framer-motion'
import { Download, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getSources } from '../api/api'
import useAppStore from '../store/useAppStore'

const SOURCE_COLORS = {
  kaggle: '#20beff',
  worldbank: '#3b82f6',
  uci: '#8b5cf6',
  datagov: '#10b981',
}

export default function SourceExplorer({ onClose, onLoadDataset }) {
  const [sources, setSources] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { isDatasetLoaded } = useAppStore()

  useEffect(() => {
    getSources()
      .then((r) => setSources(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = Object.entries(sources).flatMap(([sourceKey, src]) =>
    src.datasets
      .filter((ds) => {
        const label = src.dataset_labels?.[ds] || ds
        return (
          !search ||
          label.toLowerCase().includes(search.toLowerCase()) ||
          src.name.toLowerCase().includes(search.toLowerCase())
        )
      })
      .map((ds) => ({
        sourceKey,
        sourceName: src.name,
        dataset: ds,
        label: src.dataset_labels?.[ds] || ds,
        description: src.description,
        requiresAuth: src.requires_auth,
      }))
  )

  return (
    <motion.div
      className="explorer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="explorer-modal"
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="explorer-modal__header">
          <h2>Source Explorer</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="explorer-modal__search">
          <Search size={15} className="explorer-modal__search-icon" />
          <input
            className="input explorer-modal__search-input"
            type="text"
            placeholder="Search datasets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="explorer-modal__results">
          {loading ? (
            <div className="explorer-modal__loading">
              <div className="spinner" />
              <span>Loading sources…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="explorer-modal__empty">
              No datasets match "<strong>{search}</strong>"
            </div>
          ) : (
            <div className="explorer-modal__grid">
              {filtered.map(({ sourceKey, sourceName, dataset, label, description, requiresAuth }) => {
                const loaded = isDatasetLoaded(sourceKey, dataset)
                const accent = SOURCE_COLORS[sourceKey] ?? '#6366f1'
                return (
                  <motion.div
                    key={`${sourceKey}|${dataset}`}
                    className="explorer-card"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className="explorer-card__stripe"
                      style={{ background: accent }}
                    />
                    <div className="explorer-card__body">
                      <div className="explorer-card__source" style={{ color: accent }}>
                        {sourceName}
                      </div>
                      <div className="explorer-card__title">{label}</div>
                      <div className="explorer-card__desc">{description}</div>
                      {requiresAuth && (
                        <span className="badge badge--warn">Requires API key</span>
                      )}
                    </div>
                    <button
                      className={`btn btn--sm ${loaded ? 'btn--ghost' : 'btn--primary'}`}
                      disabled={loaded}
                      onClick={() => onLoadDataset(sourceKey, dataset, label)}
                    >
                      {loaded ? (
                        'Loaded'
                      ) : (
                        <>
                          <Download size={12} /> Load
                        </>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <div className="explorer-modal__footer">
          {filtered.length} dataset{filtered.length !== 1 ? 's' : ''} available
        </div>
      </motion.div>
    </motion.div>
  )
}
