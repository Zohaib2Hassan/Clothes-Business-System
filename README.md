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

The frontend opens `http://localhost:5173/` automatically. Port 5173 is fixed: if another process is using it, Vite reports an error instead of moving the website to a different address. Keep the terminal running while using the app.

---

## Available Scripts

- `npm run dev`: Starts the Node.js backend, Python ML service, and Vite frontend concurrently.
- `npm run dev:server`: Starts only the Node.js backend with nodemon.
- `npm run dev:client`: Starts only the Vite frontend dev server.
- `npm run dev:ml`: Starts the Python FastAPI ML microservice with uvicorn.
- `npm run build`: Compiles TypeScript and builds the frontend production bundle.
- `npm run lint`: Runs Oxlint code linter.
- `npm test`: Runs regression tests for Pakistan date boundaries, empty dashboards, notification clearing, and session handling. Use Node.js 24 or newer for these tests.

Dashboard charts show recorded sales for every day in the selected Pakistan date range. The period revenue card is the sum of those sales; forecasts remain available on the Predictions screen. An empty notification inbox stays empty until a new business event creates a notification.

## Temporary public sharing

Keep the backend and ML service running. Build the website with `npm.cmd run build`, then run `npm.cmd run share:server` in another terminal. The share server uses `http://127.0.0.1:4173`, serves the compiled website, and forwards `/api` requests to the backend on port 5000. It does not serve the source directory or `.env` files.

With Cloudflare's `cloudflared` installed, run `cloudflared tunnel --url http://127.0.0.1:4173`. Share the HTTPS URL printed by that command. Visitors sign in or create their own account. The link is temporary and requires this computer, the app services, and the tunnel to stay running and online. Restarting a Quick Tunnel generates a new URL.

## Docker Desktop and Docker Hub

Open Docker Desktop with Linux containers enabled. Keep a local `.env` with `JWT_SECRET` set; Gemini, payment, and email settings are optional runtime configuration. These files, local database records, and saved models are excluded from the image build.

```powershell
docker compose up -d --build --wait
```

Open **http://localhost:8080**. Docker Desktop lists the three containers under **clothes-business-system**: the website/API, Python forecasting service, and MongoDB. MongoDB records and trained models are stored in named Docker volumes. `docker compose stop` stops the application; `docker compose start` starts it again. `docker compose down` removes the containers while retaining their volumes. Avoid adding `-v` unless you intend to delete the Docker data.

To copy the original local database into an empty Docker database, keep the original backend running and run `node scripts/copyLocalDataToDocker.js` once. It preserves record IDs and indexes, refuses to overwrite existing Docker records, and leaves the original database unchanged. After copying, the original app and Docker app have separate databases; subsequent changes do not synchronize automatically.

The default Docker Hub repository is `zohaibhassan1368/clothes-business-system`. Set `DOCKERHUB_USERNAME` in `.env` to use another namespace. The `latest` tag contains the website/API; the `ml` tag contains the forecasting service. After signing in with `docker login`, publish only the application images:

```powershell
docker compose push web ml
```

On another computer, download them with `docker compose pull`, then start them with `docker compose up -d --no-build --wait`. Provide your own local `.env`; uploaded images do not contain API keys, account records, or database volumes. Docker Hub stores the images and does not host a publicly accessible running website.


## Android and iPhone companion app

[Threadly Pocket source and setup](mobile/README.md) is included under `mobile/`. It uses the website account and database for shared products, stock, customers, sales, expenses, reports and business settings. The earlier on-device mode remains separate.

```powershell
cd mobile
npm.cmd ci
npm.cmd start
```

[Download the signed Android 1.1.0 testing APK](https://expo.dev/artifacts/eas/BW5D4qsLJHqI2f7jG5KK4D0TrqynP0r8iyjVk04YQwg.apk). Enter the current public HTTPS website address in the app; temporary testing links can expire or change. See [store/build instructions](mobile/STORE_RELEASE.md) and [validation details](mobile/VALIDATION.md). Store publication and full physical-device QA remain pending. Mobile code is excluded from the website Docker image build context.
