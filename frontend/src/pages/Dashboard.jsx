import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Moon, Sun, X, AlertCircle } from 'lucide-react'
import { useCallback, useState } from 'react'
import { fetchDataset, uploadFile } from '../api/api'
import ChartPanel from '../components/ChartPanel'
import DragCanvas from '../components/DragCanvas'
import DataTable from '../components/DataTable'
import FilterBar from '../components/FilterBar'
import Sidebar from '../components/Sidebar'
import SourceExplorer from '../components/SourceExplorer'
import useAppStore from '../store/useAppStore'

export default function Dashboard() {
  const {
    isLoading, error, sidebarOpen, explorerOpen,
    setLoading, setError, clearError,
    setSidebarOpen, setExplorerOpen,
    addDataset, isDatasetLoaded,
    getActiveDataset, getActiveRows,
    theme, toggleTheme,
  } = useAppStore()

  const [dragActiveId, setDragActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const loadDataset = useCallback(
    async (source, dataset, label) => {
      if (isDatasetLoaded(source, dataset)) return
      setLoading(true)
      clearError()
      try {
        const res = await fetchDataset(source, dataset)
        addDataset(source, dataset, label || dataset, res.data)
      } catch (err) {
        setError(err.response?.data?.error ?? 'Failed to load dataset')
      } finally {
        setLoading(false)
      }
    },
    [isDatasetLoaded, setLoading, clearError, addDataset, setError]
  )

  const handleFileUpload = useCallback(
    async (file) => {
      setLoading(true)
      clearError()
      try {
        const res = await uploadFile(file)
        addDataset('upload', file.name, file.name, res.data)
      } catch (err) {
        setError(err.response?.data?.error ?? 'Failed to upload file')
      } finally {
        setLoading(false)
      }
    },
    [setLoading, clearError, addDataset, setError]
  )

  const handleDragStart = ({ active }) => setDragActiveId(active.id)

  const handleDragEnd = ({ active, over }) => {
    setDragActiveId(null)
    if (over?.id === 'canvas-drop' && active.id) {
      const [source, ...rest] = active.id.split('|')
      const dataset = rest.join('|')
      loadDataset(source, dataset, dataset)
    }
  }

  const handleDragCancel = () => setDragActiveId(null)

  const activeDataset = getActiveDataset()
  const activeRows = getActiveRows()

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="dashboard">
        {/* ── Mobile header ── */}
        <div className="dashboard__mobile-bar">
          <button
            className="icon-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="dashboard__mobile-title">DataSphere</span>
          <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* ── Sidebar ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              className="dashboard__sidebar"
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Sidebar
                onLoadDataset={loadDataset}
                onFileUpload={handleFileUpload}
                onOpenExplorer={() => setExplorerOpen(true)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main workspace ── */}
        <main className="dashboard__main">
          {/* Global error toast */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="error-toast"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
                <button onClick={clearError} className="icon-btn icon-btn--sm">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading bar */}
          {isLoading && <div className="loading-bar" />}

          <DragCanvas isLoading={isLoading} onLoadDataset={loadDataset} />

          {activeDataset && (
            <>
              <FilterBar
                columns={activeDataset.data.columns}
                dtypes={activeDataset.data.dtypes}
                summary={activeDataset.data.summary}
                rows={activeDataset.data.rows}
              />
              <DataTable
                columns={activeDataset.data.columns}
                rows={activeRows}
                dtypes={activeDataset.data.dtypes}
                nulls={activeDataset.data.nulls}
                shape={activeDataset.data.shape}
              />
            </>
          )}
        </main>

        {/* ── Chart panel ── */}
        <aside className="dashboard__chart-panel">
          <ChartPanel
            activeDataset={activeDataset}
            rows={activeRows}
          />
        </aside>

        {/* DragOverlay — visual ghost while dragging */}
        <DragOverlay>
          {dragActiveId && (
            <div className="drag-overlay-card">
              <span>{dragActiveId.split('|').pop()}</span>
            </div>
          )}
        </DragOverlay>
      </div>

      {/* ── Source Explorer modal ── */}
      <AnimatePresence>
        {explorerOpen && (
          <SourceExplorer
            onClose={() => setExplorerOpen(false)}
            onLoadDataset={(source, dataset, label) => {
              loadDataset(source, dataset, label)
              setExplorerOpen(false)
            }}
          />
        )}
      </AnimatePresence>
    </DndContext>
  )
}
