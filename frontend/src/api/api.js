import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE || ''

const client = axios.create({ baseURL: BASE, timeout: 45_000 })

if (import.meta.env.DEV) {
  client.interceptors.request.use((cfg) => {
    console.log(`[API] → ${cfg.method?.toUpperCase()} ${cfg.url}`, cfg.data ?? cfg.params ?? '')
    return cfg
  })
  client.interceptors.response.use(
    (res) => {
      console.log(`[API] ← ${res.status} ${res.config.url}`)
      return res
    },
    (err) => {
      console.error(`[API] ✗ ${err.config?.url}`, err.response?.data ?? err.message)
      return Promise.reject(err)
    }
  )
}

export const getSources = () => client.get('/api/sources')

export const fetchDataset = (source, dataset) =>
  client.get(`/api/fetch/${source}/${dataset}`)

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const transformData = (data, operation, params) =>
  client.post('/api/transform', { data, operation, params })

export const generateChart = (data, chartType, x, y, color, title) =>
  client.post('/api/chart', { data, chart_type: chartType, x, y, color, title })

export default client
