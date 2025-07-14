// ML API URL configuration for different environments
export const ML_API_URL = (() => {
  if (process.env.NODE_ENV === "development") {
    return 'http://127.0.0.1:5000/predict-all';
  } else if (process.env.ML_API_URL) {
    // For cloud deployments (Railway, Render, etc.)
    return process.env.ML_API_URL;
  } else {
    // For Docker deployment
    return 'http://ml-api:5000/predict-all';
  }
})();