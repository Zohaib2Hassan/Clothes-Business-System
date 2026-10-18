# Threadly ML Forecasting Engine
### Real Machine Learning Component for Clothing Business Assistant (FYP Documentation)

---

## 1. Executive Summary & Purpose
This machine learning subsystem provides **data-driven, quantitative sales and demand forecasting** for the Threadly clothing management platform. 

### Why Machine Learning?
Traditional manual estimation or static formulas fail to capture:
1. **Temporal autocorrelation**: Past sales trends directly influence immediate future demand.
2. **Day-of-week seasonality**: Clothing retail experiences distinct weekend spikes and weekday lulls.
3. **Product & category velocity**: Shifts in consumer preferences (e.g., Kurta vs. Formal Shirts).
4. **Uncertainty & risk**: Quantifiable prediction intervals for inventory safety buffers.

---

## 2. Separation of Concerns: Machine Learning vs. Google Gemini AI

A foundational principle of this architecture is strict separation between statistical learning and large language models:

| Component | Technology | Primary Responsibility | What it NEVER does |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | PyMongo / Mongoose | Ground truth historical transactions, stock counts, catalog | Never invents numbers |
| **Machine Learning Engine** | Python, scikit-learn, pandas | Preprocessing, feature engineering, chronological model training, numerical sales & demand forecasts, confidence bounds, evaluation metrics ($R^2$, MAE, RMSE) | Never outputs natural language conversation or marketing copy |
| **Backend API Gateway** | Node.js, Express.js | Authentication, business logic, routing, bridging React to Python ML | Never invents forecasts |
| **Google Gemini AI** | `@google/genai` (gemini-2.5-flash) | Natural language explanation, strategic interpretation of ML metrics, stockout risk mitigation, inventory advice | **Never generates or fabricates numerical forecasts** |
| **Frontend UI** | React, TypeScript, Recharts | Interactive visualization, charts, KPI cards, filters, and user feedback | Never renders fake static data |

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

---

## 3. Data Pipeline & Schema Integration

### 3.1 MongoDB Collections Used
- **`sales` Collection**:
  - `date`: Transaction timestamp (UTC converted to date).
  - `items`: Array of sold items (`product`, `name`, `category`, `quantity`, `price`, `total`).
  - `totalAmount`: Revenue realized per transaction.
  - `user`: Tenant scoping ID for multi-tenant isolation.
- **`products` Collection**:
  - `_id`, `name`, `category`, `stock`, `price`, `costPrice`, `sku`.

### 3.2 Data Preprocessing Pipeline (`data_preprocessing.py`)
1. **Extraction**: Query MongoDB for user's sales records sorted chronologically.
2. **Aggregation**: Flatten multi-item receipts into daily aggregates:
   $$\text{Total Daily Units} = \sum_{i \in \text{receipts}} \text{quantity}_i$$
   $$\text{Total Daily Revenue} = \sum_{i \in \text{receipts}} \text{totalAmount}_i$$
3. **Date Continuity & Zero-Filling**: Time-series models require contiguous time steps. Missing dates in the historical window are filled with $0$ sales to preserve true zero-demand days without distorting moving averages.
4. **Data Sufficiency Rule**:
   - **Minimum Requirement**: $\ge 14$ contiguous days of historical records.
   - If historical records $< 14$, the engine flags `insufficient_data: true` and gracefully serves a **7-Day Moving Average** baseline rather than fitting an over-parameterized model on scarce data.

---

## 4. Feature Engineering (`feature_engineering.py`)

To predict future unit sales ($y_t$), we build features using **strictly historical information available up to day $t-1$**.

### Prevention of Data Leakage (Zero Future Information)
- **Lag Features**:
  - $\text{lag}_1 = y_{t-1}$ (yesterday's sales)
  - $\text{lag}_2 = y_{t-2}$
  - $\text{lag}_3 = y_{t-3}$
  - $\text{lag}_7 = y_{t-7}$ (same day last week)
  - $\text{lag}_{14} = y_{t-14}$ (two weeks ago)
- **Rolling Window Statistics**:
  - $\text{rolling\_mean}_3 = \frac{1}{3}\sum_{k=1}^3 y_{t-k}$
  - $\text{rolling\_mean}_7 = \frac{1}{7}\sum_{k=1}^7 y_{t-k}$
  - $\text{rolling\_std}_7 = \sqrt{\frac{1}{6}\sum_{k=1}^7 (y_{t-k} - \text{rolling\_mean}_7)^2}$
- **Calendar & Seasonality Features**:
  - `day_of_week` (0 to 6, Monday to Sunday)
  - `is_weekend` (1 if Saturday or Sunday, else 0)
  - `month` (1 to 12)
- **Sales Velocity**:
  - $\text{velocity\_ratio} = \frac{\text{rolling\_mean}_3 + 0.1}{\text{rolling\_mean}_7 + 0.1}$

> **Important**: No rolling metric or feature uses $y_t$ or $y_{t+k}$. This ensures zero target leakage during training and recursive inference.

---

## 5. Model Architecture & Selection

### 5.1 Chronological Split (No Random Shuffling)
Time-series data has temporal order. Random k-fold cross-validation or random train-test splitting causes temporal lookahead leakage.
- **Training Set**: Earliest 80% of contiguous days.
- **Testing Set**: Most recent 20% of contiguous days (unseen future test window).

### 5.2 Baseline Comparison (`models/baseline.py`)
Before selecting a machine learning model, we benchmark against:
- **7-Day Moving Average Baseline**:
  $$\hat{y}_t = \frac{1}{7}\sum_{k=1}^7 y_{t-k}$$
- **Persistence (Naive) Baseline**:
  $$\hat{y}_t = y_{t-1}$$

### 5.3 Candidate Models Evaluated (`models/forecaster.py`)
1. **Ridge Regression ($\ell_2$-regularized Linear Model)**:
   - Resilient against collinearity among rolling lag features.
   - Highly interpretable, low computational footprint.
2. **Random Forest Regressor**:
   - Ensemble of decision trees capturing non-linear threshold effects.
3. **Gradient Boosting Regressor**:
   - Sequential boosting minimizing squared loss.

### 5.4 Model Selection Strategy
The automated training pipeline evaluates all candidate models against the test split. The candidate model that yields the lowest Mean Absolute Error ($MAE$) on the held-out test split is serialized as the active forecaster:
$$\text{Best Model} = \arg\min_{m \in \text{Candidates}} \text{MAE}_{\text{test}}(m)$$

---

## 6. Evaluation Metrics Explained

| Metric | Formula | Meaning | Academic Clarification |
| :--- | :--- | :--- | :--- |
| **Mean Absolute Error (MAE)** | $\frac{1}{n}\sum_{i=1}^n \|y_i - \hat{y}_i\|$ | Average absolute unit error between predicted and actual sales. | e.g., $\text{MAE} = 2.5$ means the forecast is off by approximately $\pm 2.5$ garments per day. |
| **Root Mean Squared Error (RMSE)** | $\sqrt{\frac{1}{n}\sum_{i=1}^n (y_i - \hat{y}_i)^2}$ | Penalizes larger outlier prediction errors more severely than MAE. | Useful for inventory risk where large stockout errors have non-linear business costs. |
| **Coefficient of Determination ($R^2$)** | $1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$ | Proportion of variance in sales explained by the features. | **Never called "accuracy percentage"**. $R^2 = 0.81$ means the model explains 81% of historical demand variation. |
| **Uncertainty Bounds (95% CI)** | $\hat{y}_t \pm 1.96 \cdot \sigma_{\text{residuals}}$ | Empirical prediction interval computed from test residual standard deviation. | Provides lower and upper bounds for inventory safety stock buffers. |

---

## 7. Multi-Step Recursive Forecasting

For an $H$-day forecasting horizon (e.g., 7, 15, 30, 60, or 90 days):
1. Compute feature vector $\mathbf{x}_{T+1}$ using known historical data up to day $T$.
2. Predict demand $\hat{y}_{T+1} = \text{Model}(\mathbf{x}_{T+1})$.
3. Append $\hat{y}_{T+1}$ to the time-series history.
4. Recompute lag features and rolling averages using the newly predicted point.
5. Recursively predict $\hat{y}_{T+2}, \dots, \hat{y}_{T+H}$.

### Revenue Forecasting
Product-level historical average transaction prices are applied to predicted unit demand to project revenue accurately without arbitrary price multipliers:
$$\text{Projected Revenue} = \sum_{\text{day}=1}^H \hat{y}_{\text{day}} \times \overline{\text{Price}}_{\text{historical}}$$

---

## 8. API Architecture

### FastAPI Microservice Endpoints (Port 8000)
- `GET /health`: Health status, runtime version, and engine metadata.
- `POST /predict`: Generates $H$-day forecasts, category demand velocity, stockout risks, and model metrics.
- `POST /train`: Retrains candidate models on fresh MongoDB data, executes chronological evaluation, and saves the best model to disk.

### Node.js Gateway Routes (`/api/ai/`)
- `GET /api/ai/predictions?horizon=30&category=all`: Calls FastAPI `/predict` with automatic fallback to baseline if the ML microservice is unreachable.
- `POST /api/ai/predictions/update`: Triggers retraining via FastAPI `/train`.
- `POST /api/ai/predictions/explain`: Passes the real ML metrics to Gemini 2.5 Flash for natural language strategic explanation.

---

## 9. Academic Defense / FYP Presentation Guide

When presenting this project to examiners, emphasize the following points:

1. **Why not just use Gemini for forecasting?**
   > *Large Language Models are probabilistic text generators. They lack time-series numerical regression capabilities and hallucinate numbers. By using scikit-learn for forecasting and Gemini for natural language explanation, we achieve both mathematical rigor and human interpretability.*

2. **How did you prevent data leakage?**
   > *All lag and rolling features at time $t$ strictly use values from $t-1$ and earlier. We use chronological train-test splitting (80% training, 20% future testing) instead of random shuffling.*

3. **Why is $R^2$ not called "accuracy"?**
   > *Accuracy is a classification metric (fraction of correct categorical labels). For continuous numerical regression, $R^2$ represents the proportion of variance explained by the model relative to a naive mean baseline.*

4. **What happens if a store is newly opened and has only 3 sales?**
   > *The system checks for data sufficiency ($\ge 14$ days). If insufficient, it transparently notifies the user and applies a 7-day Moving Average baseline instead of claiming artificial ML accuracy.*

---

## 10. Running the System

### Running All Services Concurrently
From the project root:
```bash
npm run dev
```
This runs:
- **Node.js / Express Backend**: `http://localhost:5000`
- **Python FastAPI ML Service**: `http://127.0.0.1:8000`
- **React + Vite Frontend**: `http://localhost:5173`

### Running the Python ML Service Independently
```bash
cd ml
venv\Scripts\activate
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```
