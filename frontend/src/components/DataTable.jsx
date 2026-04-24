import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useRef, useState, useMemo } from 'react'

const DTYPE_BADGE = {
  int64: { label: 'int', cls: 'badge--num' },
  int32: { label: 'int', cls: 'badge--num' },
  float64: { label: 'float', cls: 'badge--num' },
  float32: { label: 'float', cls: 'badge--num' },
  object: { label: 'str', cls: 'badge--str' },
  bool: { label: 'bool', cls: 'badge--bool' },
}

function dtypeBadge(dtype) {
  for (const [key, val] of Object.entries(DTYPE_BADGE)) {
    if (dtype?.includes(key)) return val
  }
  if (dtype?.includes('datetime')) return { label: 'date', cls: 'badge--date' }
  return { label: dtype?.slice(0, 4) ?? '?', cls: '' }
}

function isNull(v) {
  return v === null || v === undefined || v === ''
}

export default function DataTable({ columns, rows, dtypes, nulls, shape }) {
  const parentRef = useRef(null)
  const [sort, setSort] = useState({ col: null, dir: 'asc' })

  const sorted = useMemo(() => {
    if (!sort.col) return rows
    return [...rows].sort((a, b) => {
      const av = a[sort.col]
      const bv = b[sort.col]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort])

  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38,
    overscan: 8,
  })

  const toggleSort = (col) =>
    setSort((s) =>
      s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }
    )

  if (!columns || columns.length === 0) return null

  return (
    <motion.div
      className="data-table-wrapper"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="data-table-scroll" ref={parentRef}>
        <table className="data-table" style={{ minWidth: columns.length * 140 }}>
          <thead className="data-table__head">
            <tr>
              {columns.map((col) => {
                const badge = dtypeBadge(dtypes?.[col])
                const isActive = sort.col === col
                const nullCount = nulls?.[col] ?? 0
                return (
                  <th key={col} className="data-table__th" onClick={() => toggleSort(col)}>
                    <div className="data-table__th-inner">
                      <span className="data-table__col-name">{col}</span>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      {nullCount > 0 && (
                        <span className="badge badge--warn" title={`${nullCount} nulls`}>
                          {nullCount}∅
                        </span>
                      )}
                      <span className="data-table__sort-icon">
                        {isActive ? (
                          sort.dir === 'asc' ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )
                        ) : (
                          <ArrowUpDown size={11} className="muted" />
                        )}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
              display: 'block',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((vRow) => {
              const row = sorted[vRow.index]
              return (
                <tr
                  key={vRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${vRow.size}px`,
                    transform: `translateY(${vRow.start}px)`,
                    display: 'table',
                    tableLayout: 'fixed',
                  }}
                  className={`data-table__row ${vRow.index % 2 === 0 ? '' : 'data-table__row--alt'}`}
                >
                  {columns.map((col) => {
                    const val = row[col]
                    const nullVal = isNull(val)
                    return (
                      <td
                        key={col}
                        className={`data-table__td ${nullVal ? 'data-table__td--null' : ''}`}
                        title={String(val ?? '')}
                      >
                        {nullVal ? <span className="null-badge">null</span> : String(val)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="data-table__footer">
        <span>
          Showing {Math.min(rows.length, sorted.length).toLocaleString()} of{' '}
          {shape?.[0]?.toLocaleString() ?? rows.length} rows
        </span>
        <span>{columns.length} columns</span>
      </div>
    </motion.div>
  )
}
