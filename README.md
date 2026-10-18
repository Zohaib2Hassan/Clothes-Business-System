# AI Business Assistant Management System for Clothing Business (Threadly)

A production-grade, full-stack enterprise retail management and forecasting platform built for apparel businesses. The system combines an interactive desktop management dashboard, real-time inventory and POS tracking, an automated Python Machine Learning forecasting engine, and Google Gemini AI strategic advisory.

---

## Architecture Overview

```
                       MongoDB Atlas
                             │
                  Historical Business Data
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
             Node/Express         Python ML
                   │                   │
                   │             Data Preprocessing
                   │                   │
                   │             Feature Engineering
                   │                   │
                   │             Model Training & Evaluation
                   │                   │
                   │             Multi-step Recursive Forecast
                   │                   │
                   └─────────┬─────────┘
                             │
                             ▼
                      Forecast Results
                             │
                      ┌──────┴──────┐
                      │             │
                      ▼             ▼
                   React          Gemini
                Visualization    Explanation
                      │             │
                      └──────┬──────┘
                             ▼
                      Business User
```

### Core Components
1. **Frontend**: React 18, TypeScript, Vite, TailwindCSS / CSS variables, Lucide icons, Recharts.
2. **Backend Gateway**: Node.js, Express.js, JWT Authentication, Mongoose.
3. **Database**: MongoDB Atlas / embedded MongoDB with Mongoose ODM (`Sales`, `Products`, `Expenses`, `Customers`).
4. **Machine Learning Service**: Python 3.14, FastAPI, scikit-learn, pandas, numpy, pymongo, joblib.
5. **Generative AI Advisory**: Google Gemini 2.5 Flash (`@google/genai`) for conversational assistance, product copy generation, and natural language interpretation of ML forecasts.

---

## Machine Learning Forecasting Engine (`ml/`)

The platform includes a dedicated, data-driven Machine Learning microservice for sales and demand forecasting:
- **No Synthetic or Mocked Predictions**: Forecasts and metrics ($R^2$, MAE, RMSE) are dynamically computed from MongoDB sales history.
- **Chronological Split**: 80% train / 20% future test split without random shuffling to prevent temporal data leakage.
- **Baseline Benchmarking**: Evaluates candidate models (Ridge Regression, Random Forest, Gradient Boosting) against a 7-day Moving Average baseline.
- **Strict Separation of Concerns**: Scikit-learn generates the quantitative forecasts; Google Gemini AI interprets and explains the forecasts to the business owner.

For full technical and academic FYP details, see the dedicated [ML Documentation](file:///e:/clothing%20business%20assistant/ml/README.md).

---

## Quick Start & Running Locally

### Prerequisites
- Node.js (v18+ recommended)
- Python (v3.10+ recommended)
- MongoDB Atlas URI or local MongoDB

### Environment Configuration
Ensure `.env` in the root directory contains:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
ML_SERVICE_URL=http://127.0.0.1:8000
```

### Running All Services Concurrently
```bash
npm run dev
```
This single command runs:
- **Backend**: Express API on `http://localhost:5000`
- **ML Service**: Python FastAPI on `http://127.0.0.1:8000`
- **Frontend**: Vite Dev Server on `http://localhost:5173`

---

## Available Scripts

- `npm run dev`: Starts the Node.js backend, Python ML service, and Vite frontend concurrently.
- `npm run dev:server`: Starts only the Node.js backend with nodemon.
- `npm run dev:client`: Starts only the Vite frontend dev server.
- `npm run dev:ml`: Starts the Python FastAPI ML microservice with uvicorn.
- `npm run build`: Compiles TypeScript and builds the frontend production bundle.
- `npm run lint`: Runs Oxlint code linter.
