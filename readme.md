# RiskFusion AI

An AI-powered full-stack financial risk assessment platform that fuses two independent XGBoost machine learning models — **Fraud Detection** and **Credit Default Risk** — into a single weighted **Fusion Risk Score** to support real-time financial decisions.

---

## Architecture

```
Browser (React + Vite)  ←→  Flask REST API (Python)
                                 ├── Fraud Model  (XGBoost, 431 features)
                                 ├── Credit Model (XGBoost, 146 features)
                                 └── Fusion Engine (weighted combination)
```

---

## Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS, Recharts, Framer Motion |
| Backend  | Python 3, Flask, Flask-CORS |
| ML       | XGBoost, scikit-learn, pandas, numpy, joblib |

---

## Quick Start

```bash
# Clone and enter the repo
cd RiskFusion_AI

# Start both servers with one command
python run.py
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

> `run.py` automatically installs `node_modules` and Python dependencies on first run.

### Manual start

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Features

| Page | Route | Description |
|---|---|---|
| Home | `/` | Landing page with navigation |
| Dashboard | `/dashboard` | Simplified quick-evaluation form using the real Fusion API |
| Fraud Test | `/fraud-test` | Full 18-field fraud detection form, live XGBoost prediction |
| Credit Test | `/credit-test` | Full 35-field credit risk form, live XGBoost prediction |
| **Fusion Test** | `/fusion-test` | Combined dual-model form, returns Fraud + Credit + Fusion scores |
| Model Data | `/model-data` | Feature importances, hyperparameters, confusion matrices, Fusion weights |
| Result | `/result` | Animated result page with gauges and contribution charts |

---

## API Reference

### Fraud Model

| Endpoint | Method | Description |
|---|---|---|
| `/api/fraud/predict` | POST | Predict fraud probability from transaction features |
| `/api/fraud/model-info` | GET | Model metadata, hyperparameters, top 25 features, UI field config |
| `/api/fraud/evaluate` | GET | Evaluate on 20% holdout set (accuracy, AUC, confusion matrix) |
| `/api/fraud/confusion-matrix` | GET | Returns confusion matrix PNG image |

**Predict request body:**
```json
{ "TransactionAmt": 250.0, "ProductCD": 1, "card4": 1, ... }
```

**Predict response:**
```json
{
  "fraud_probability": 0.042,
  "fraud_percentage": 4.2,
  "prediction": 0,
  "decision": "APPROVE",
  "risk_level": "Low"
}
```

---

### Credit Model

| Endpoint | Method | Description |
|---|---|---|
| `/api/credit/predict` | POST | Predict default probability from applicant features |
| `/api/credit/model-info` | GET | Model metadata, threshold, metrics, UI field config |

**Predict request body:**
```json
{ "AMT_INCOME_TOTAL": 180000, "AMT_CREDIT": 450000, "AGE_YEARS": 35, ... }
```

**Predict response:**
```json
{
  "default_probability": 0.31,
  "default_percentage": 31.0,
  "prediction": 0,
  "decision": "REVIEW",
  "risk_level": "Medium",
  "threshold_used": 0.69
}
```

---

### Fusion Engine

| Endpoint | Method | Description |
|---|---|---|
| `/api/fusion/predict` | POST | Run both models and return a weighted fusion score |
| `/api/fusion/model-info` | GET | Fusion contexts, weight matrix, decision tiers |

**Predict request body:**
```json
{
  "context": "loan",
  "TransactionAmt": 500,
  "AMT_INCOME_TOTAL": 180000,
  "AMT_CREDIT": 400000
}
```

**Fusion contexts and weights:**

| Context | Credit Weight | Fraud Weight |
|---|---|---|
| `loan` | 70% | 30% |
| `transaction` | 40% | 60% |
| `limit` | 50% | 50% |

**Predict response:**
```json
{
  "fraud_probability": 0.042,
  "fraud_percentage": 4.2,
  "credit_probability": 0.31,
  "credit_percentage": 31.0,
  "fusion_score": 0.230,
  "fusion_percentage": 23.0,
  "fraud_weight": 0.3,
  "credit_weight": 0.7,
  "context": "loan",
  "decision": "APPROVE",
  "risk_level": "Low"
}
```

**Decision tiers (Fusion Score):**

| Score | Risk Level | Decision |
|---|---|---|
| 0 – 25% | Low | APPROVE |
| 25 – 45% | Low-Medium | REVIEW |
| 45 – 65% | Medium | REVIEW |
| 65 – 80% | High | DECLINE |
| 80 – 100% | Very High | DECLINE |

---

## Models

### Fraud Detection Model
- **Dataset**: [IEEE CIS Fraud Detection](https://www.kaggle.com/c/ieee-fraud-detection) — 100K transactions
- **Algorithm**: XGBoost Classifier
- **Features**: 431 (Vesta engineered + card, identity, count, timedelta, match features)
- **Missing values**: defaulted to `−999`
- **Artifact**: `backend/fraud_model/fraud_xgboost.pkl`

### Credit Default Risk Model
- **Dataset**: [Home Credit Default Risk](https://www.kaggle.com/c/home-credit-default-risk) — 307K applicants
- **Algorithm**: XGBoost Classifier
- **Features**: 146 engineered (EXT_SOURCEs, bureau aggregates, installment delays, credit card utilization)
- **Threshold**: Tuned via Optuna (5-fold CV) to maximise F1 for minority default class (default: `0.69`)
- **Missing values**: retained as native NaN (XGBoost handles natively)
- **Artifact**: `backend/credit_model/credit_xgb_model.joblib`

---

## Project Structure

```
RiskFusion_AI/
├── run.py                   # Single-command launcher for both servers
├── backend/
│   ├── app.py               # Flask API (fraud + credit + fusion endpoints)
│   ├── requirements.txt
│   ├── fraud_model/
│   │   ├── fraud_xgboost.pkl
│   │   ├── train.py
│   │   ├── preprocess.py
│   │   └── evaluate.py
│   ├── credit_model/
│   │   ├── credit_xgb_model.joblib
│   │   └── preprocessing_pipeline.joblib
│   └── fusion_model/
│       └── fusion_engine.py  # Standalone prototype (logic is in app.py)
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── FraudTest.jsx
    │   │   ├── CreditTest.jsx
    │   │   ├── FusionTest.jsx   ← new
    │   │   ├── ModelData.jsx
    │   │   └── Result.jsx
    │   └── components/
    │       ├── GaugeChart.jsx
    │       ├── ContributionPie.jsx
    │       ├── FraudForm.jsx
    │       ├── CreditForm.jsx
    │       ├── ContextSelector.jsx
    │       └── PageWrapper.jsx
    └── package.json
```

---

## License

MIT
