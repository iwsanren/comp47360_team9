# Documentation: app.py - Real-Time Busyness API

## Overview

`app.py` is a Flask-based web application that serves a real-time API endpoint (`/api/busyness`) for estimating transit **busyness levels** in Manhattan, NYC. It combines predictions from two trained XGBoost models:

- **Subway Ridership Model**: Predicts hourly ridership at subway stations.
- **Taxi Pickup Model**: Predicts hourly taxi pickup counts per zone.

The combined data is used to classify each Manhattan zone into one of six **busyness levels** ranging from "Very Quiet" to "Extremely Busy".

---

## Functionality Breakdown

### 1. **Weather Fetching**

- The app queries the OpenWeatherMap API for current conditions in New York City.
- Required weather fields: `temp`, `feels_like`, `humidity`, `wind_speed`, and `weather_main`.
- **Fallback**: If the weather API fails, default values are used:
  ```python
  {
    "temp": 15, "feels_like": 15,
    "humidity": 60, "wind_speed": 3,
    "weather_main": "Clear"
  }
  ```

### 2. **Subway Feature Generation**

- Loads metadata for all subway stations.
- Constructs features using the current timestamp and weather data.
- Uses cyclical encodings and binary flags for time-of-day, weekday, and holiday.
- Weather-derived binary flags include: `has_rain`, `has_snow`, `is_freezing`, `is_hot`.
- An ordinal feature `temp_category` is derived and encoded from temperature.
- Only the features listed in `required_features.json` are passed to the model.
- Aggregates predictions to the **zone level** via a `station_to_zone_mapping` file.
- Merges with historical percentile thresholds to classify subway busyness into 6 levels.
- If no data exists for a zone, it is marked as `subway_level = "No Data"`.

### 3. **Taxi Feature Generation**

- Generates features for **all taxi zones** using static spatial data and the same weather + time features.
- Weather conditions are one-hot encoded (e.g., `weather_Rain`, `weather_Clear`, etc.).
- Predicts hourly taxi pickups using the trained model.
- Merges with historical percentiles to classify busyness using the same 6-level system.

### 4. **Busyness Level Scoring**

Each zone gets three labels:

- `subway_level`
- `taxi_level`
- `combined_level`

The `combined_level` is a weighted score:

- If both models succeed:
  ```python
  combined_score = 0.7 * subway_score + 0.3 * taxi_score
  ```
- If **subway model fails**:
  ```python
  combined_score = taxi_score
  ```
- If **taxi model fails**:
  ```python
  combined_score = subway_score
  ```
- If **both models fail**:
  ```python
  combined_score = 2  # "Moderate"
  ```

The numeric score is then mapped back to a string level using `SCORE_TO_LEVEL`.

### 5. **Output Format**

- The `/api/busyness` route returns a JSON array of zone-level records with the fields:
  ```json
  [
    {
      "PULocationID": 142,
      "subway_level": "Very Busy",
      "taxi_level": "Very Quiet",
      "combined_level": "Busy"
    },
    ...
  ]
  ```

---

## Required Files

| File Name                                     | Purpose                                            |
| --------------------------------------------- | -------------------------------------------------- |
| `subway_ridership_model_xgboost_final.joblib` | Subway model file (XGBoost)                        |
| `xgboost_taxi_model.joblib`                   | Taxi model file (XGBoost)                          |
| `required_features.json`                      | Ordered list of subway model input features        |
| `subway_stations.csv`                         | Station metadata including location & ID           |
| `station_to_zone_mapping.csv`                 | Maps stations to taxi `PULocationID`s              |
| `zone_subway_busyness_stats.csv`              | Subway zone/hour/day percentile data               |
| `zone_hourly_busyness_stats.csv`              | Taxi zone/hour/day percentile data                 |
| `manhattan_taxi_zones.csv`                    | Taxi zone metadata including geometry and centroid |

---

## API Summary

### Endpoint

```
GET /api/busyness
```

### Returns

- JSON array of `PULocationID` with `subway_level`, `taxi_level`, and `combined_level`.

---

## Dependencies

- `Flask`
- `joblib`
- `pandas`, `numpy`
- `requests`
- `zoneinfo`, `datetime`, `json`, `pathlib`

---

## Notes

- The app runs in development mode and is not suited for production without a WSGI server.
- The OpenWeather API key is hardcoded and should be secured in a `.env` file or environment variable.
- Zones with no subway stations mapped will have `subway_level = "No Data"`.
- Both models are provided with the exact features used during training to ensure consistent predictions.
- If **all model predictions fail**, `combined_level` will default to **"Moderate"** to avoid empty or misleading data.

