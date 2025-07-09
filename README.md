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

- **Frontend**: Next.js (React framework), Leaflet / Mapbox, TypeScript
- **Backend API**: Next.js API Routes, Node.js
- **Machine Learning**: scikit-learn, XGBoost (Python microservice)
- **Routing Engine**: OSRM
- **Deployment**: Docker + GitLab CI/CD on Linux server
- **Infrastructure**: Docker Compose, nginx

## Project Structure

```
├── webapp/                 # Next.js frontend application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── Dockerfile         # Docker configuration
│   └── package.json       # Dependencies
├── ml/                    # Python ML API service
│   ├── app.py            # Flask API server
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Docker configuration
├── scripts/              # Deployment scripts
│   ├── setup-server.sh   # Server initialization
│   └── test-config.sh    # Configuration testing
├── docs/                 # Documentation
├── docker-compose.yml    # Multi-service configuration
└── .gitlab-ci.yml       # CI/CD pipeline
```

## How to Run the Project

### Local Development

#### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for ML service development)

#### Quick Start with Docker
```bash
# Clone the repository
git clone https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9.git
cd comp47360_team9

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# ML API: http://localhost:5000
```

#### Development Mode
```bash
# Frontend development
cd webapp
npm install
npm run dev

# ML service development
cd ml
pip install -r requirements.txt
python app.py
```

### Production Deployment

The project uses GitLab CI/CD for automated deployment to a Linux server.

#### Deployment URLs
- **Staging**: http://137.43.49.26:3030 (develop branch)
- **Production**: http://137.43.49.26:8080 (main branch)

#### Setup Deployment
1. Configure GitLab CI/CD variables (see `SETUP-NEXT-STEPS.md`)
2. Set up SSH keys for server access
3. Push to `develop` branch for staging deployment
4. Merge to `main` branch for production deployment

For detailed setup instructions, see:
- `SETUP-NEXT-STEPS.md` - Quick setup guide
- `docs/quick-setup-guide.md` - Detailed instructions
- `CONFIGURATION-SUMMARY.md` - Complete configuration overview

## Features

- **Interactive Map**: Leaflet/Mapbox integration for NYC navigation
- **Route Planning**: Multi-modal transportation options
- **Real-time Data**: Weather, air quality, bike availability
- **ML Predictions**: Crowd density and busyness forecasting
- **Responsive Design**: Mobile-first approach
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


