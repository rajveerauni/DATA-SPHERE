import { create } from 'zustand'

let _nextId = 1

const useAppStore = create((set, get) => ({
  // ── Datasets ────────────────────────────────────────────────────────────────
  datasets: [],           // [{ id, source, dataset, label, data }]
  activeDatasetId: null,
  transformedRows: null,  // null → use original data.rows

  // ── Chart ───────────────────────────────────────────────────────────────────
  chartConfig: { type: 'bar', x: null, y: null, color: null, title: '' },
  chartFigure: null,      // Plotly JSON string from /api/chart

  // ── UI ──────────────────────────────────────────────────────────────────────
  isLoading: false,
  error: null,
  sidebarOpen: true,
  explorerOpen: false,

  // ── Dataset actions ─────────────────────────────────────────────────────────
  addDataset: (source, dataset, label, data) => {
    const id = `ds-${_nextId++}`
    set((s) => ({
      datasets: [...s.datasets, { id, source, dataset, label, data }],
      activeDatasetId: id,
      transformedRows: null,
      chartFigure: null,
      chartConfig: { type: 'bar', x: null, y: null, color: null, title: '' },
    }))
    return id
  },

  removeDataset: (id) =>
    set((s) => {
      const remaining = s.datasets.filter((d) => d.id !== id)
      const newActive =
        s.activeDatasetId === id
          ? remaining.length > 0
            ? remaining[remaining.length - 1].id
            : null
          : s.activeDatasetId
      return { datasets: remaining, activeDatasetId: newActive, transformedRows: null }
    }),

  setActiveDataset: (id) =>
    set({ activeDatasetId: id, transformedRows: null, chartFigure: null }),

  reorderDatasets: (orderedIds) =>
    set((s) => {
      const map = Object.fromEntries(s.datasets.map((d) => [d.id, d]))
      return { datasets: orderedIds.map((id) => map[id]).filter(Boolean) }
    }),

  setTransformedRows: (rows) => set({ transformedRows: rows }),

  // ── Chart actions ────────────────────────────────────────────────────────────
  setChartConfig: (patch) =>
    set((s) => ({ chartConfig: { ...s.chartConfig, ...patch } })),

  setChartFigure: (figure) => set({ chartFigure: figure }),

  // ── UI actions ───────────────────────────────────────────────────────────────
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  clearError: () => set({ error: null }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setExplorerOpen: (v) => set({ explorerOpen: v }),

  // ── Theme ────────────────────────────────────────────────────────────────────
  theme: localStorage.getItem('ds-theme') || 'dark',
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('ds-theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return { theme: next }
    }),

  // ── Derived helpers ──────────────────────────────────────────────────────────
  getActiveDataset: () => {
    const s = get()
    return s.datasets.find((d) => d.id === s.activeDatasetId) ?? null
  },

  getActiveRows: () => {
    const s = get()
    const active = s.datasets.find((d) => d.id === s.activeDatasetId)
    if (!active) return []
    return s.transformedRows ?? active.data.rows
  },

  isDatasetLoaded: (source, dataset) =>
    get().datasets.some((d) => d.source === source && d.dataset === dataset),
}))

export default useAppStore
