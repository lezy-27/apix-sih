# Real-Time Airfare Price Index (APIx) Platform

A high-frequency retail airfare inflation tracker and macroeconomic analytics platform for India. Built on the **Directorate General of Civil Aviation (DGCA)** representative route framework, advance booking windows ($T+1$ to $T+60$), airline market share geometric weighting, Median Absolute Deviation (MAD) outlier sanitization, and a modern React + TypeScript dashboard.

---

## System Architecture

```
Airline & OTA Sources (IndiGo, AI, Akasa, SpiceJet, MMT, EMT)
                         ↓
              Data Extraction Engine
     (Playwright Async Crawlers / Synthetic Generator)
                         ↓
           Data Cleaning & Normalization
  (Net Consumer Fare, 6-Tuple De-duplication, MAD Filtering)
                         ↓
             TimescaleDB / PostgreSQL
                 (SQLite Fallback)
                         ↓
           APIx Index Calculation Engine
  (Carrier Geo-Mean, Booking-Window Weights, DGCA Composite)
                         ↓
                FastAPI REST API
     (Pydantic Models, CORS, High-Frequency Telemetry)
                         ↓
            React + TypeScript Dashboard
   (Government / Economic Analytics Aesthetic, Recharts)
```

---

## Core Methodology & Specifications

### 1. DGCA Representative Route Weights ($W_r$)
- **DEL-BOM**: 0.25 (Delhi ↔ Mumbai)
- **DEL-BLR**: 0.20 (Delhi ↔ Bengaluru)
- **BOM-BLR**: 0.15 (Mumbai ↔ Bengaluru)
- **DEL-CCU**: 0.15 (Delhi ↔ Kolkata)
- **BLR-HYD**: 0.12 (Bengaluru ↔ Hyderabad)
- **MAA-DEL**: 0.13 (Chennai ↔ Delhi)
- *Total = 1.00*

### 2. Advance Booking Windows & Weights ($w_t$)
- **T+1**: 0.15 (Last-minute corporate surge)
- **T+7**: 0.35 (Short-haul business velocity — Heaviest)
- **T+15**: 0.25 (Planned corporate/domestic travel)
- **T+30**: 0.15 (Advance leisure window)
- **T+60**: 0.10 (Promotional holiday window)
- *Total = 1.00*

### 3. Carrier Market Shares ($s_c$)
- **IndiGo (6E)**: 0.60
- **Air India (AI)**: 0.25
- **Akasa Air (QP)**: 0.08
- **SpiceJet (SG)**: 0.07
- *Total = 1.00*

### 4. Mathematical Formula
1. **Carrier Geometric Mean**:
   $$P_{r, t} = \exp\left(\frac{\sum_{c} s_c \cdot \ln(P_{r, t, c})}{\sum s_c}\right)$$
2. **Weighted Route Price**:
   $$P_r = \sum_{t} w_t \cdot P_{r, t}$$
3. **Route Relative Price Index**:
   $$I_r = \frac{P_r}{P_{r, \text{base}}} \times 100$$
4. **National APIx Index**:
   $$\text{APIx} = \sum_{r} W_r \cdot I_r$$

### 5. Cleaning & Outlier Detection
- **Net Consumer Fare**: `base_fare + taxes_udf` (excludes discretionary ancillaries and convenience fees).
- **6-Tuple De-duplication**: Keyed on `(origin, destination, departure_date, advance_days, carrier, flight_number)`.
- **Modified Z-Score / MAD Anomaly Detection**:
  $$M_i = \frac{0.6745 \cdot (x_i - \text{median})}{\text{MAD}}$$
  Fares with $|M_i| > 3.5$ are flagged and removed from index calculation.

---

## Directory Structure

```
apix-platform/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── scraper.py
│   │   │   ├── cleaner.py
│   │   │   ├── index_engine.py
│   │   │   ├── analytics.py
│   │   │   └── seeder.py
│   │   └── routers/
│   │       ├── dashboard.py
│   │       ├── fares.py
│   │       ├── index.py
│   │       ├── elasticity.py
│   │       └── scraping.py
│   ├── tests/
│   │   ├── test_index_engine.py
│   │   ├── test_cleaner.py
│   │   └── test_api.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## Running the Project

### 1. Backend Setup

```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Install Playwright browser
playwright install chromium

# 3. Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

- API Documentation: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

- Web Dashboard: [http://localhost:5173](http://localhost:5173)

---

## REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/apix/daily` | Current National APIx Index, 24h change %, 30d inflation %, quotes collected |
| `GET` | `/api/v1/apix/history?days=30` | Historical APIx index & official CPI benchmark comparison (7d, 30d, 90d, 1y) |
| `GET` | `/api/v1/apix/routes` | All 6 DGCA representative routes with weight, avg fare, daily delta, and sparkline |
| `GET` | `/api/v1/apix/elasticity?route=ALL` | Lead-time price elasticity curve (T+1 to T+60) with carrier fare spreads |
| `GET` | `/api/v1/fares` | Searchable, paginated fare quotes table with carrier, route, and date filters |
| `GET` | `/api/v1/scraping/status` | Ingestion status, last successful run timestamp, failed sources |
| `GET` | `/api/v1/data-quality` | Quality score %, duplicates removed, MAD outliers filtered |
| `POST` | `/api/v1/scraping/run` | Triggers extraction run, MAD cleaning, and index recalculation |

---

## Running Tests

```bash
cd backend
python -m pytest tests
```
