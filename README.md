# DataSphere — Multi-Source Analytics Dashboard

A full-stack data analytics portfolio app built with **Flask + React + Plotly**.
Pull live datasets from Kaggle, World Bank, UCI, and Data.gov. Drag datasets onto
a canvas, apply transformations, and render interactive charts.

---

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | Python 3.11+, Flask, Pandas, Plotly |
| Frontend | React 18, Vite, Framer Motion, @dnd-kit |
| Charts | Plotly.js via react-plotly.js |
| State | Zustand |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Table | @tanstack/react-virtual |

---

## Quick Start

### 1. Clone and set up environment

```bash
cd datasphere
cp .env.example .env
# Edit .env with your Kaggle credentials (optional — other sources work without a key)
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Flask runs at http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Vite dev server at http://localhost:3000
```

---

## Data Sources

| Source | Auth Required | Notes |
|---|---|---|
| Kaggle | Yes (API key) | Set `KAGGLE_USERNAME` + `KAGGLE_KEY` in `.env` |
| World Bank | No | REST API, 2000–2023, 4 indicators |
| UCI ML Repo | No | Iris, Breast Cancer, Heart Disease |
| Data.gov | No | CKAN API, dynamic search |
| CSV Upload | No | Drag any .csv/.xlsx onto the sidebar upload zone |

### Getting a Kaggle API key

1. Log in at [kaggle.com](https://kaggle.com)
2. Profile → Account → API → Create New Token
3. Copy `username` and `key` from the downloaded `kaggle.json`

---

## API Endpoints

```
GET  /api/sources                     List all sources and datasets
GET  /api/fetch/<source>/<dataset>    Fetch a dataset
POST /api/upload                      Upload CSV/XLSX
POST /api/transform                   Apply transformation
POST /api/chart                       Generate Plotly figure
```

### Transform operations

| Operation | Description |
|---|---|
| `filter` | Filter rows by column conditions (eq/ne/gt/lt/contains/in/between) |
| `dropna` | Drop rows containing null values |
| `groupby` | Group + aggregate (mean/sum/count/min/max) |
| `normalize` | Min-max scale numeric columns to [0, 1] |
| `correlation` | Return Pearson correlation matrix |

---

## Project Structure

```
datasphere/
├── backend/
│   ├── app.py               Flask API + all endpoints
│   ├── config.py            Env-based configuration
│   ├── requirements.txt
│   └── modules/
│       ├── kaggle_fetcher.py
│       ├── worldbank_fetcher.py
│       ├── uci_fetcher.py
│       ├── datagov_fetcher.py
│       ├── data_processor.py
│       └── chart_engine.py
└── frontend/
    ├── src/
    │   ├── pages/           LandingPage, Dashboard
    │   ├── components/      Sidebar, DragCanvas, DataTable, FilterBar, ChartPanel, SourceExplorer
    │   ├── store/           Zustand global state
    │   ├── api/             Axios API layer
    │   └── styles/          Global CSS
    └── vite.config.js
```
