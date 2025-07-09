# COMP47360_Team9 - Manhattan My Way​

This is a full-stack web application designed to help New Yorkers make smarter, greener, and less crowded mobility decisions.

## Team Members

| Name               | Role                |
| ------------------ | ------------------- |
| HSUAN-YU TAN       | Back-End Code Lead  |
| Zhaofang He        | Maintenance Lead    |
| Neasa Ní Fhátharta | Data Lead           |
| Martynas Kapocius  | Coordination Lead   |
| Prakhar Dayal      | Front-End Code Lead |

## Tech Stack

- **webapp**: Next.js (React framework), Leaflet / Mapbox, Node.js
- **Machine Learning**: scikit-learn, XGBoost (Python microservice)
- **Routing Engine**: OSRM
- **Deployment**: Render

## How to Run the Project

Frontend (Next.js + Leaflet/Mapbox)
TODO: Add setup instructions (e.g., npm install, npm run dev)

Backend (Node.js + API)
TODO: Add backend setup and run instructions (e.g., npm run start, API endpoints)

ML Microservice (Python)
TODO: Add instructions for setting up Python service (e.g., Flask, FastAPI)

OSRM Routing Engine
TODO: Add how to launch and integrate OSRM

## Git Branching Model

We use a simple Git branching strategy based on `main`, `develop`, and `feature/*`.

- `main`: Stable and deployable version.
- `develop`: Integration branch for all features.
- `feature/*`: One branch per feature (created from `develop`, merged back into `develop`).
- `hotfix/*`: For urgent fixes (from `main`, merged into `main` and `develop`).

See `docs/git_workflow.md` for full explanation and diagram.

## Project Structure
```
comp47360_team9/
├── .next/                  # [ignored] Next.js build output
├── node_modules/           # [ignored] Node.js dependencies
├── osrm-data/              # [ignored] OSRM-generated routing files
├── .env                    # [ignored] Environment variables (API keys, secrets)
├── .gitignore              # Git ignore rules
├── README.md               # Project overview and instructions

# App Frontend (Next.js + Leaflet/Mapbox)
├── public/                 # Static assets (e.g. favicon, icons)
├── pages/                  # Next.js page routes (index.js, about.js etc.)
├── components/             # Reusable UI components
├── styles/                 # CSS modules or global styles

# Node.js Backend
├── api/                    # Custom backend logic (if using API routes or server)
│   ├── index.js
│   └── route.js

# Python ML Microservice
├── ml/                     # Lightweight Python-based microservice (Flask/FastAPI)
│   ├── model.pkl           # Trained model
│   ├── predictor.py        # Inference script or API
│   └── requirements.txt    # Python dependencies

# OSRM
├── osrm/                   # OSRM setup scripts or Docker config
│   └── run_osrm.sh

# Documentation
├── docs/                   # Collaboration docs and team process
│   ├── git_workflow.md
│   └── architecture.md

# Deployment
├── render.yaml             # Render deployment config (optional)
└── Dockerfile              # for full containerized deployment
```


