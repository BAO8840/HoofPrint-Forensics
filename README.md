# HoofPrint Forensics

Full-stack forensic hoofprint classification system. Backend: FastAPI + my
trained models. Frontend: Vite + React + TypeScript + Tailwind + TanStack Query.

## 1. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Copy your trained models** from Kaggle's `/kaggle/working/deployment_models/`
folder into `backend/models/`:
- `random_forest.joblib`
- `efficientnet_lstm_best.keras`

**Set up Supabase:**
1. Create a project at supabase.com (free tier is fine)
2. Go to SQL Editor, paste and run everything in `backend/supabase_schema.sql`
3. Go to Project Settings -> API, copy the Project URL and the `service_role` key
   (NOT the `anon` key — the backend needs the service role key)

**Set up Cloudinary:**
1. Create a free account at cloudinary.com
2. From the dashboard, copy your Cloud Name, API Key, and API Secret

**Configure environment:**
```bash
cp .env.example .env
# edit .env and fill in the Supabase and Cloudinary values above
```

**Run the backend:**
```bash
AnalysisResult
```

First startup will take a minute — it's downloading ResNet50's ImageNet weights
and loading both models. Visit `http://localhost:8000/api/health` to confirm
it's up, or `http://localhost:8000/docs` for the interactive API explorer.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`.

## 3. Deployment notes

- **Backend**: needs enough memory to hold TensorFlow + ResNet50 + EfficientNetB0
  in RAM (roughly 1.5-2GB). Free tiers on Render/Railway are often too small for
  this — check their current limits before deploying. WeasyPrint also needs
  system-level dependencies (Pango, Cairo) that some minimal container images
  don't include by default; if PDF generation fails on deploy, check their
  installation docs for your platform.
- **Frontend**: any static host works (Vercel, Netlify, Render static site).
  Set `VITE_API_BASE_URL` to your deployed backend's URL before building.
- **CORS**: update `ALLOWED_ORIGINS` in the backend's `.env` to your deployed
  frontend's URL, or the browser will block the requests.

## Project structure

```
backend/
  main.py                 FastAPI app + startup model loading
  app/
    ml/inference.py       Loads RF + EfficientNet, runs predictions
    routers/analyze.py    POST /api/analyze
    routers/records.py    GET/PATCH records, PDF report generation
    db.py                 Supabase client
    cloudinary_utils.py   Image upload
    report.py             WeasyPrint PDF rendering
  templates/report_template.html
  supabase_schema.sql      Run this in Supabase's SQL editor once
  models/                  <- put your .joblib/.keras files here

frontend/
  src/
    pages/                 Analyse, Results, Records, About
    components/            Navbar, StepLoader, ProbabilityBar
    lib/api.ts             Typed API client
```
