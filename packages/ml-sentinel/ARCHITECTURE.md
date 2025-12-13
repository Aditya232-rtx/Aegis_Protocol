# Aegis Protocol - System Architecture

## Frontend Integration with Backend "Nodes"

This document explains how the backend microservices (nodes) integrate with your frontend application.

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Frontend
        FE[React/Next.js Frontend]
    end
    
    subgraph API_Layer[API Gateway Layer]
        API[Express.js REST API Server<br/>Node 4]
    end
    
    subgraph Backend_Services[Backend Microservices - Nodes]
        DS[Data Scraper Service<br/>Puppeteer/WebSocket<br/>Node 1]
        DB[(Database<br/>PostgreSQL/TimescaleDB<br/>Node 2)]
        LSTM[LSTM Model Service<br/>Python Flask/FastAPI<br/>Node 3]
    end
    
    FE -->|HTTP REST API| API
    API -->|Query BLR Data| DS
    API -->|Read Historical Data| DB
    API -->|Get Predictions| LSTM
    DS -->|Store Data| DB
    LSTM -->|Read Training Data| DB
    DS -.->|Trigger| LSTM
    
    style FE fill:#3b82f6,color:#fff
    style API fill:#10b981,color:#fff
    style DS fill:#f59e0b,color:#fff
    style DB fill:#8b5cf6,color:#fff
    style LSTM fill:#ec4899,color:#fff
```

---

## 📡 API Endpoints for Frontend

Your frontend will communicate with the **Express.js REST API** (Node 4):

### Endpoint 1: Get Current Market Depth
```http
GET /api/market-depth
```

**Response:**
```json
{
  "timestamp": "2025-12-13T08:30:00.000Z",
  "blr": 0.3512,
  "buyVolume": 45.23,
  "sellVolume": 128.76,
  "midPrice": 2245.70,
  "status": "critical",
  "alert": true
}
```

### Endpoint 2: Get Historical BLR Data
```http
GET /api/market-depth/history?hours=24
```

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2025-12-13T08:00:00.000Z",
      "blr": 0.42,
      "midPrice": 2240.50
    },
    {
      "timestamp": "2025-12-13T08:05:00.000Z",
      "blr": 0.38,
      "midPrice": 2242.30
    }
  ],
  "count": 288
}
```

### Endpoint 3: Get LSTM Prediction
```http
GET /api/predictions/price?horizon=1h
```

**Response:**
```json
{
  "currentPrice": 2245.70,
  "predictedPrice": 2190.50,
  "confidence": 0.87,
  "direction": "down",
  "horizon": "1h",
  "timestamp": "2025-12-13T08:30:00.000Z"
}
```

### Endpoint 4: Get System Status
```http
GET /api/status
```

**Response:**
```json
{
  "scraper": {
    "status": "running",
    "lastScrape": "2025-12-13T08:29:45.000Z",
    "lastBLR": 0.3512
  },
  "lstm": {
    "status": "ready",
    "modelVersion": "v1.2.0",
    "lastPrediction": "2025-12-13T08:28:00.000Z"
  },
  "database": {
    "status": "healthy",
    "recordCount": 12450
  }
}
```

---

## 🔧 Backend Node Responsibilities

### Node 1: Data Scraper Service (Puppeteer/WebSocket)

**Technology:** Node.js + Puppeteer
**Port:** 3001

**Responsibilities:**
- Scrape Binance order book every 60 seconds
- Calculate BLR in real-time
- Store data in database
- Trigger LSTM pipeline when BLR < 0.4
- Expose internal API for manual scraping

**Internal API:**
```javascript
POST /scraper/trigger  // Manual scrape trigger
GET  /scraper/status   // Get scraper status
GET  /scraper/latest   // Get latest BLR data
```

### Node 2: Database (PostgreSQL/TimescaleDB)

**Technology:** PostgreSQL with TimescaleDB extension
**Port:** 5432

**Schema:**
```sql
-- Time-series table for market depth data
CREATE TABLE market_depth (
    timestamp TIMESTAMPTZ NOT NULL,
    blr DECIMAL(10, 4),
    buy_volume DECIMAL(20, 8),
    sell_volume DECIMAL(20, 8),
    mid_price DECIMAL(10, 2),
    alert_triggered BOOLEAN
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('market_depth', 'timestamp');

-- Index for fast queries
CREATE INDEX idx_market_depth_timestamp ON market_depth (timestamp DESC);
```

### Node 3: LSTM Model Service (Python)

**Technology:** Python + Flask/FastAPI + TensorFlow
**Port:** 5000

**Responsibilities:**
- Train LSTM model on historical BLR data
- Generate price predictions
- Expose REST API for predictions
- Retrain model periodically

**API:**
```python
POST /model/predict     # Get price prediction
POST /model/train       # Trigger model retraining
GET  /model/metrics     # Get model performance metrics
```

### Node 4: API Gateway (Express.js)

**Technology:** Node.js + Express
**Port:** 3000

**Responsibilities:**
- Public-facing REST API
- Authentication & rate limiting
- Request routing to backend services
- Response aggregation
- CORS handling for frontend

---

## 🔌 Frontend Integration Example

### React Component Example

```javascript
// hooks/useMarketDepth.js
import { useState, useEffect } from 'react';

export function useMarketDepth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketDepth = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/market-depth');
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch initially
    fetchMarketDepth();

    // Poll every 10 seconds
    const interval = setInterval(fetchMarketDepth, 10000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
```

```javascript
// components/MarketDepthDashboard.jsx
import { useMarketDepth } from '../hooks/useMarketDepth';

export function MarketDepthDashboard() {
  const { data, loading, error } = useMarketDepth();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Market Depth Monitor</h1>
      
      {data.alert && (
        <div className="alert-banner">
          🚨 CRITICAL: BLR dropped to {(data.blr * 100).toFixed(2)}%
        </div>
      )}
      
      <div className="metrics">
        <div className="metric">
          <h3>Buy-Side Liquidity Ratio</h3>
          <p className={data.blr < 0.4 ? 'critical' : 'stable'}>
            {(data.blr * 100).toFixed(2)}%
          </p>
        </div>
        
        <div className="metric">
          <h3>Buy Volume</h3>
          <p>{data.buyVolume.toFixed(2)} ETH</p>
        </div>
        
        <div className="metric">
          <h3>Sell Volume</h3>
          <p>{data.sellVolume.toFixed(2)} ETH</p>
        </div>
        
        <div className="metric">
          <h3>Mid Price</h3>
          <p>${data.midPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Deployment Flow

### Development Setup

```bash
# Terminal 1: Start Database
docker run -d -p 5432:5432 timescale/timescaledb-ha:pg14

# Terminal 2: Start Scraper Service (Node 1)
cd ml-sentinel/data-pipeline
npm start

# Terminal 3: Start LSTM Service (Node 3)
cd ml-sentinel/model
python app.py

# Terminal 4: Start API Gateway (Node 4)
cd api-server
npm start

# Terminal 5: Start Frontend
cd frontend
npm run dev
```

### Production Deployment

**Option 1: Docker Compose**
```yaml
version: '3.8'
services:
  database:
    image: timescale/timescaledb-ha:pg14
    ports:
      - "5432:5432"
  
  scraper:
    build: ./ml-sentinel/data-pipeline
    depends_on:
      - database
  
  lstm:
    build: ./ml-sentinel/model
    depends_on:
      - database
  
  api:
    build: ./api-server
    ports:
      - "3000:3000"
    depends_on:
      - scraper
      - lstm
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api
```

**Option 2: Kubernetes**
- Each node becomes a separate deployment
- Use ConfigMaps for environment variables
- Use Services for inter-pod communication
- Ingress for frontend routing

---

## 🔐 Security Considerations

1. **API Authentication**
   - Use JWT tokens for API access
   - Implement rate limiting (express-rate-limit)
   - CORS whitelist for frontend domain

2. **Environment Variables**
   ```bash
   DATABASE_URL=postgresql://user:pass@localhost:5432/aegis
   LSTM_SERVICE_URL=http://localhost:5000
   SCRAPER_SERVICE_URL=http://localhost:3001
   JWT_SECRET=your-secret-key
   ```

3. **HTTPS in Production**
   - Use SSL certificates
   - Reverse proxy with Nginx

---

## 📊 Data Flow Example

1. **User opens frontend** → React app loads
2. **Frontend calls** `GET /api/market-depth`
3. **API Gateway** routes to Scraper Service (Node 1)
4. **Scraper** returns latest BLR from memory/cache
5. **API Gateway** formats response
6. **Frontend** displays BLR dashboard
7. **If BLR < 0.4:**
   - Scraper triggers LSTM (Node 3)
   - LSTM generates prediction
   - Frontend polls `GET /api/predictions/price`
   - Displays prediction to user

---

## ✅ Summary

**"Nodes" = Backend Microservices**, NOT the absence of APIs!

**Frontend connects to:**
- REST API (Express.js) on port 3000

**Backend architecture:**
- Node 1: Data Scraper (Puppeteer)
- Node 2: Database (PostgreSQL)
- Node 3: LSTM Model (Python)
- Node 4: API Gateway (Express)

**Next Steps:**
1. ✅ Test the fixed Puppeteer crawler
2. Create Express.js API server (Node 4)
3. Set up PostgreSQL database schema (Node 2)
4. Build LSTM model service (Node 3)
5. Connect frontend to API endpoints
