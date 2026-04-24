import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, Download, Share2, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import Plot from 'react-plotly.js'
import { generateChart } from '../api/api'
import useAppStore from '../store/useAppStore'

const CHART_TYPES = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'histogram', label: 'Histogram' },
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'box', label: 'Box' },
  { value: 'pie', label: 'Pie' },
]

function ColSelect({ label, value, columns, onChange, allowNone }) {
  return (
    <div className="chart-field">
      <label className="chart-field__label">{label}</label>
      <select
        className="input input--sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        {allowNone && <option value="">— none —</option>}
        {columns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ChartPanel({ activeDataset, rows }) {
  const { chartConfig, chartFigure, setChartConfig, setChartFigure, setError } =
    useAppStore()

  const [building, setBuilding] = useState(false)

  const columns = activeDataset?.data?.columns ?? []

  const buildChart = useCallback(async () => {
    if (!activeDataset || !rows?.length) return
    setBuilding(true)
    try {
      const res = await generateChart(
        rows,
        chartConfig.type,
        chartConfig.x,
        chartConfig.y,
        chartConfig.color,
        chartConfig.title
      )
      setChartFigure(res.data.figure)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Chart generation failed')
    } finally {
      setBuilding(false)
    }
  }, [activeDataset, rows, chartConfig, setChartFigure, setError])

  const exportPng = useCallback(() => {
    if (!chartFigure) return
    const fig = JSON.parse(chartFigure)
    const Plotly = window.Plotly
    const el = document.getElementById('plotly-chart')
    if (Plotly && el) Plotly.downloadImage(el, { format: 'png', filename: 'datasphere-chart' })
  }, [chartFigure])

  const copyJson = useCallback(() => {
    if (!chartFigure) return
    navigator.clipboard.writeText(chartFigure)
  }, [chartFigure])

  const parsedFigure = chartFigure ? JSON.parse(chartFigure) : null

  return (
    <div className="chart-panel">
      <div className="chart-panel__header">
        <BarChart2 size={16} />
        <span>Chart Builder</span>
      </div>

      {/* Config form */}
      <div className="chart-panel__config">
        {/* Chart type */}
        <div className="chart-field">
          <label className="chart-field__label">Chart Type</label>
          <select
            className="input input--sm"
            value={chartConfig.type}
            onChange={(e) => setChartConfig({ type: e.target.value })}
          >
            {CHART_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {chartConfig.type !== 'heatmap' && (
          <ColSelect
            label="X Axis"
            value={chartConfig.x}
            columns={columns}
            onChange={(v) => setChartConfig({ x: v })}
            allowNone={false}
          />
        )}

        {!['histogram', 'heatmap'].includes(chartConfig.type) && (
          <ColSelect
            label="Y Axis"
            value={chartConfig.y}
            columns={columns}
            onChange={(v) => setChartConfig({ y: v })}
            allowNone={false}
          />
        )}

        {!['heatmap', 'histogram', 'pie'].includes(chartConfig.type) && (
          <ColSelect
            label="Color By"
            value={chartConfig.color}
            columns={columns}
            onChange={(v) => setChartConfig({ color: v })}
            allowNone
          />
        )}

        <div className="chart-field">
          <label className="chart-field__label">Title</label>
          <input
            className="input input--sm"
            type="text"
            placeholder="Chart title…"
            value={chartConfig.title}
            onChange={(e) => setChartConfig({ title: e.target.value })}
          />
        </div>

        <button
          className="btn btn--primary btn--block"
          onClick={buildChart}
          disabled={building || !activeDataset}
        >
          {building ? (
            <>
              <Loader2 size={14} className="spin" /> Generating…
            </>
          ) : (
            <>
              <BarChart2 size={14} /> Generate Chart
            </>
          )}
        </button>
      </div>

      {/* Chart output */}
      <AnimatePresence mode="wait">
        {parsedFigure && (
          <motion.div
            className="chart-panel__output"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Plot
              divId="plotly-chart"
              data={parsedFigure.data}
              layout={{
                ...parsedFigure.layout,
                autosize: true,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
              }}
              style={{ width: '100%', height: 320 }}
              useResizeHandler
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['sendDataToCloud'],
              }}
            />

            <div className="chart-panel__export-row">
              <button className="btn btn--ghost btn--sm" onClick={exportPng}>
                <Download size={13} /> PNG
              </button>
              <button className="btn btn--ghost btn--sm" onClick={copyJson}>
                <Share2 size={13} /> Copy JSON
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeDataset && (
        <div className="chart-panel__empty">
          Load a dataset to start building charts.
        </div>
      )}
    </div>
  )
}
