import { motion } from 'framer-motion'
import { Filter, RotateCcw, Check } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import { transformData } from '../api/api'
import useAppStore from '../store/useAppStore'

const selectStyles = {
  control: (b) => ({
    ...b,
    background: 'var(--bg-tertiary)',
    borderColor: 'var(--border)',
    minHeight: 34,
    fontSize: 12,
  }),
  menu: (b) => ({ ...b, background: 'var(--bg-tertiary)', zIndex: 50 }),
  option: (b, s) => ({
    ...b,
    background: s.isFocused ? 'var(--primary)' : 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: 12,
  }),
  multiValue: (b) => ({ ...b, background: 'var(--primary-dark)' }),
  multiValueLabel: (b) => ({ ...b, color: 'var(--text-primary)' }),
  singleValue: (b) => ({ ...b, color: 'var(--text-primary)' }),
  input: (b) => ({ ...b, color: 'var(--text-primary)' }),
  placeholder: (b) => ({ ...b, color: 'var(--text-muted)' }),
}

function isNumeric(dtype) {
  return dtype?.includes('int') || dtype?.includes('float')
}

function isDateCol(dtype) {
  return dtype?.includes('datetime')
}

function RangeFilter({ col, summary, onChange }) {
  const min = summary?.[col]?.min ?? 0
  const max = summary?.[col]?.max ?? 100
  const [val, setVal] = useState([min, max])

  useEffect(() => setVal([min, max]), [min, max])

  return (
    <div className="filter-control">
      <label className="filter-control__label">{col}</label>
      <div className="range-inputs">
        <input
          type="number"
          className="input input--sm"
          value={val[0]}
          min={min}
          max={val[1]}
          step="any"
          onChange={(e) => {
            const v = [parseFloat(e.target.value), val[1]]
            setVal(v)
            onChange({ column: col, operator: 'between', value: v })
          }}
        />
        <span className="range-sep">–</span>
        <input
          type="number"
          className="input input--sm"
          value={val[1]}
          min={val[0]}
          max={max}
          step="any"
          onChange={(e) => {
            const v = [val[0], parseFloat(e.target.value)]
            setVal(v)
            onChange({ column: col, operator: 'between', value: v })
          }}
        />
      </div>
    </div>
  )
}

function MultiSelectFilter({ col, rows, onChange }) {
  const options = useMemo(() => {
    const vals = [...new Set(rows.map((r) => r[col]).filter((v) => v != null))]
    return vals.slice(0, 200).map((v) => ({ value: v, label: String(v) }))
  }, [rows, col])

  return (
    <div className="filter-control">
      <label className="filter-control__label">{col}</label>
      <Select
        isMulti
        options={options}
        styles={selectStyles}
        placeholder="All values…"
        onChange={(sel) =>
          onChange(
            sel?.length
              ? { column: col, operator: 'in', value: sel.map((s) => s.value) }
              : null
          )
        }
      />
    </div>
  )
}

function DateRangeFilter({ col, onChange }) {
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)

  const update = (s, e) => {
    if (s && e) onChange({ column: col, operator: 'between', value: [s.toISOString(), e.toISOString()] })
  }

  return (
    <div className="filter-control">
      <label className="filter-control__label">{col}</label>
      <div className="date-range">
        <DatePicker
          selected={start}
          onChange={(d) => { setStart(d); update(d, end) }}
          selectsStart
          startDate={start}
          endDate={end}
          placeholderText="From"
          className="input input--sm"
        />
        <DatePicker
          selected={end}
          onChange={(d) => { setEnd(d); update(start, d) }}
          selectsEnd
          startDate={start}
          endDate={end}
          minDate={start}
          placeholderText="To"
          className="input input--sm"
        />
      </div>
    </div>
  )
}

export default function FilterBar({ columns, dtypes, summary, rows }) {
  const { setTransformedRows, setLoading, setError, getActiveDataset } = useAppStore()
  const [filters, setFilters] = useState({})
  const [applying, setApplying] = useState(false)

  const handleFilterChange = useCallback((col, filterObj) => {
    setFilters((p) => {
      if (filterObj === null) {
        const next = { ...p }
        delete next[col]
        return next
      }
      return { ...p, [col]: filterObj }
    })
  }, [])

  const applyFilters = useCallback(async () => {
    const activeFilters = Object.values(filters)
    const ds = getActiveDataset()
    if (!ds) return

    setApplying(true)
    try {
      if (activeFilters.length === 0) {
        setTransformedRows(null)
        return
      }
      const res = await transformData(ds.data.rows, 'filter', { filters: activeFilters })
      setTransformedRows(res.data.rows)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Filter failed')
    } finally {
      setApplying(false)
    }
  }, [filters, getActiveDataset, setTransformedRows, setError])

  const resetFilters = useCallback(() => {
    setFilters({})
    setTransformedRows(null)
  }, [setTransformedRows])

  if (!columns?.length) return null

  const visibleCols = columns.slice(0, 8) // limit to 8 columns in filter bar

  return (
    <motion.div
      className="filter-bar"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="filter-bar__header">
        <Filter size={14} />
        <span>Filters</span>
        {Object.keys(filters).length > 0 && (
          <span className="badge badge--primary">{Object.keys(filters).length} active</span>
        )}
      </div>

      <div className="filter-bar__controls">
        {visibleCols.map((col) => {
          const dtype = dtypes?.[col] ?? 'object'
          if (isNumeric(dtype)) {
            return (
              <RangeFilter
                key={col}
                col={col}
                summary={summary}
                onChange={(f) => handleFilterChange(col, f)}
              />
            )
          }
          if (isDateCol(dtype)) {
            return (
              <DateRangeFilter
                key={col}
                col={col}
                onChange={(f) => handleFilterChange(col, f)}
              />
            )
          }
          return (
            <MultiSelectFilter
              key={col}
              col={col}
              rows={rows}
              onChange={(f) => handleFilterChange(col, f)}
            />
          )
        })}
      </div>

      <div className="filter-bar__actions">
        <button
          className="btn btn--primary btn--sm"
          onClick={applyFilters}
          disabled={applying}
        >
          <Check size={13} />
          {applying ? 'Applying…' : 'Apply Filters'}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={resetFilters}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>
    </motion.div>
  )
}
