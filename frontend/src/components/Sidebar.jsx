import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Compass, Moon, Sun, Upload, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSources } from '../api/api'
import useAppStore from '../store/useAppStore'
import SourceCard from './SourceCard'

export default function Sidebar({ onLoadDataset, onFileUpload, onOpenExplorer }) {
  const [sources, setSources] = useState({})
  const [collapsed, setCollapsed] = useState({})
  const [loadingMeta, setLoadingMeta] = useState(false)
  const { isDatasetLoaded, theme, toggleTheme } = useAppStore()
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoadingMeta(true)
    getSources()
      .then((r) => setSources(r.data))
      .catch(() => {})
      .finally(() => setLoadingMeta(false))
  }, [])

  const toggleCollapse = (key) =>
    setCollapsed((p) => ({ ...p, [key]: !p[key] }))

  const handleFileDrop = useCallback(
    (e) => {
      e.preventDefault()
      const file = e.dataTransfer?.files?.[0]
      if (file) onFileUpload(file)
    },
    [onFileUpload]
  )

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileUpload(file)
    e.target.value = ''
  }

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar__header">
        <button className="sidebar__logo-btn" onClick={() => navigate('/')}>
          <Zap size={18} className="logo-icon" />
          <span className="sidebar__title">DataSphere</span>
        </button>
        <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Explorer button */}
      <button className="sidebar__explorer-btn" onClick={onOpenExplorer}>
        <Compass size={15} />
        Source Explorer
      </button>

      <div className="sidebar__divider" />

      {/* Source groups */}
      {loadingMeta ? (
        <div className="sidebar__spinner">
          <div className="spinner" />
          <span>Loading sources…</span>
        </div>
      ) : (
        Object.entries(sources).map(([key, src]) => (
          <div key={key} className="sidebar__group">
            <button
              className="sidebar__group-header"
              onClick={() => toggleCollapse(key)}
            >
              {collapsed[key] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <span className="sidebar__group-name">{src.name}</span>
              {src.requires_auth && (
                <span className="badge badge--warn">Key</span>
              )}
            </button>

            {!collapsed[key] && (
              <motion.div
                className="sidebar__group-cards"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {src.datasets.map((ds) => (
                  <SourceCard
                    key={ds}
                    source={key}
                    dataset={ds}
                    label={src.dataset_labels?.[ds] || ds}
                    isLoaded={isDatasetLoaded(key, ds)}
                    onLoad={onLoadDataset}
                  />
                ))}
              </motion.div>
            )}
          </div>
        ))
      )}

      <div className="sidebar__divider" />

      {/* CSV upload drop zone */}
      <div
        className="sidebar__upload-zone"
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={20} />
        <span>Drop CSV / XLSX here</span>
        <span className="sidebar__upload-hint">or click to browse</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
