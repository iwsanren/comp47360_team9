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
comp47360_team9/
├── README.md                    # Project overview and setup instructions
├── package.json                 # Root package.json for project metadata
├── docker-compose.yml           # Development Docker configuration
├── docker-compose.prod.yml      # Production Docker configuration
├── nginx.conf                   # Nginx configuration for production
├── .gitignore                  # Git ignore rules

# Frontend Application
├── webapp/                      # Next.js frontend application
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── layout.tsx      # Root layout component
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── globals.css     # Global styles
│   │   │   ├── api/            # API route handlers
│   │   │   │   ├── airquality/ # Air quality data endpoint
│   │   │   │   ├── bikes/      # Bike sharing data endpoint
│   │   │   │   ├── busyness/   # ML busyness prediction endpoint
│   │   │   │   ├── contact/    # Contact form endpoint
│   │   │   │   ├── directions/ # Routing directions endpoint
│   │   │   │   ├── EV-charging/ # EV charging stations endpoint
│   │   │   │   ├── parks/      # Parks data endpoint
│   │   │   │   └── weather/    # Weather data endpoint
│   │   │   ├── contact/        # Contact page
│   │   │   ├── map/            # Interactive map page
│   │   │   └── containers/     # Page-level container components
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   │   ├── assets/             # Images and static assets
│   │   ├── constants/          # App constants and icons
│   │   └── routing.json        # Routing configuration
│   ├── public/                 # Static files served by Next.js
│   │   ├── data/              # JSON data files for zones and maps
│   │   └── *.svg, *.ico       # Icons and favicons
│   ├── Dockerfile             # Docker configuration for webapp
│   ├── package.json           # Frontend dependencies
│   ├── next.config.ts         # Next.js configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── postcss.config.mjs     # PostCSS configuration
│   ├── eslint.config.mjs      # ESLint configuration
│   └── tsconfig.json          # TypeScript configuration

# Machine Learning Service
├── ml/                         # Python Flask ML API service
│   ├── app.py                 # Flask API server with prediction endpoints
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Docker configuration for ML service
│   ├── xgboost_taxi_model.joblib      # Trained XGBoost model
│   ├── manhattan_taxi_zones.csv       # NYC taxi zone reference data
│   ├── zone_hourly_busyness_stats.csv # Busyness statistics
│   └── zone_hourly_summary.csv        # Zone summary data

# Deployment & Operations
├── scripts/                    # Deployment and utility scripts
│   ├── setup-server.sh       # Server initialization script
│   ├── test-config.sh        # Configuration testing
│   ├── manual-deploy.sh      # Manual deployment script
│   ├── restart-project.sh    # Project restart utility
│   ├── diagnose-containers.sh # Container debugging
│   ├── fix-deployment.sh     # Deployment troubleshooting
│   ├── test-ml-api.sh        # ML API testing
│   ├── setup-nginx.sh       # Nginx setup script
│   ├── configure-firewall.sh # Firewall configuration
│   └── *.bat                 # Windows batch scripts
├── nginx/                     # Nginx configuration files
│   └── nginx.conf            # Nginx server block configuration

# Documentation (only git_workflow.md is tracked)
└── docs/
    └── git_workflow.md        # Git branching strategy documentation

# Note: The following directories/files are ignored by git:
# - node_modules/, .next/, dist/, out/ (build outputs)
# - .env files (environment variables)
# - osrm-data/ (OSRM routing data)
# - backup/ (backup configurations)
# - Most files in docs/ except git_workflow.md
# - __pycache__/, *.py[cod] (Python cache files)
# - .vscode/ (VS Code settings)
```

## How to Run the Project
### Local Development
#### Quick Start with Docker
```bash
docker-compose down
docker-compose up --build
```

### Production Deployment
The project uses GitLab CI/CD for automated deployment to a Linux server.
#### Deployment URLs
- **Webapp**: http://137.43.49.26 
- **Flask**: http://137.43.49.26/api/ml/ and http://137.43.49.26/api/ml/predict-all


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

