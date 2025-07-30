# Manhattan Subway Ridership Prediction Pipeline

## Overview
This project builds a full pipeline for predicting subway ridership across Manhattan stations using temporal and weather factors. The output supports real-time decision tools, zone-level busyness classification, and spatial mapping with taxi zones.

## Folder Structure
```
manhattan-subway/
├── data/
│   ├── raw/                        # Raw input files
│   │   ├── mta/
│   │   │   ├── MTA_Subway_Hourly_Ridership_Manhattan_2024.csv
│   │   │   └── MTA_Subway_Stations_Manhattan.csv
│   │   ├── manhattan_taxi_zones.csv
│   │   └── weather_data.csv
│   ├── processed/                 # Cleaned, merged, and model-ready files
│   │   ├── subway_data_cleaned.parquet
│   │   ├── weather_data_cleaned.parquet
│   │   ├── subway_data_quality_assessment.json
│   │   ├── subway_stations.csv
│   │   ├── station_to_zone_mapping.csv
│   │   ├── zone_subway_busyness_stats.csv
│   │   ├── sample_subway_features.csv
│   │   ├── integration/
│   │   │   └── weather_ridership_integrated_2024.parquet
│   │   ├── modeling/
│   │   │   ├── subway_ridership_modeling_features.parquet
│   │   │   ├── feature_metadata.json
│   │   │   ├── feature_pattern_validation.json
│   │   │   └── feature_engineering_summary.txt
│   │   │   
│   │   ├── analysis/
│   │   │   └── temporal_patterns.json
│   │   ├── models/
│   │   │   ├── subway_ridership_model_xgboost_final.joblib
│   │   │   ├── model_metadata_xgboost_final.json
│   │   │   └── required_features.json
├── results/
│   |── evaluation_plots/
│   |   └── data_quality_summary.png
│   └── weather_correlation_analysis/
│       └── weather_correlation_results.json
├── notebooks/
│   ├── 01_subway_data_integration_and_cleaning.ipynb
│   ├── 02_weather_data_cleaning_and_preprocessing.ipynb
│   ├── 03_weather_ridership_integration.ipynb
│   ├── 04_temporal_pattern_analysis.ipynb
│   ├── 05_weather_ridership_correlation_analysis.ipynb
│   ├── 06_feature_engineering.ipynb
│   ├── 07_model_development.ipynb
│   ├── 08_spatial_analysis_subway_taxi_zone_mapping.ipynb
│   ├── 09_prepare_subway_features.ipynb
│   └── 10_generate_zone_busyness_percentiles.ipynb
├── requirements.txt
```

## Notebooks and Outputs
| Notebook | Purpose | Key Outputs |
|---------|---------|-------------|
| 01 | Clean raw subway data | subway_data_cleaned.parquet, subway_data_quality_assessment.json |
| 02 | Clean weather data | weather_data_cleaned.parquet |
| 03 | Join ridership + weather | weather_ridership_integrated_2024.parquet |
| 04 | Temporal pattern analysis | temporal_patterns.json |
| 05 | Weather-ridership analysis | Feature insights (used in 06) | weather_correlation_results.json |
| 06 | Feature engineering | subway_ridership_modeling_features.parquet, feature_metadata.json, feature_pattern_validation.json, feature_engineering_summary.txt required_features.json |
| 07 | Model training + evaluation | Final model + metadata (joblib, JSON) | subway_ridership_model_xgboost_final.joblib, model_metadata_xgboost_final.json, required_features.json |
| 08 | Map subway stations to taxi zones | station_to_zone_mapping.csv |
| 09 | Generate model-ready prediction rows | sample_subway_features.csv |
| 10 | Compute zone-level busyness stats | zone_subway_busyness_stats.csv |

## Pipeline Flow
```
Raw CSVs → Cleaned parquet → Joined dataset → Feature set → Trained model → Zone busyness map
```

## Requirements
See `requirements.txt` file for exact package versions.

## How to Run
1. Run notebooks 01 through 07 in order.
2. Use notebook 08 to enable zone-level mapping.
3. Use notebook 09 to simulate predictions.
4. Use notebook 10 to generate zone percentile classifications.

## Output: Final Artifacts
- Model: `subway_ridership_model_xgboost_final.joblib`
- Metadata: `model_metadata_xgboost_final.json`
- Required Features: `required_features.json`
- Busyness thresholds: `zone_subway_busyness_stats.csv`

