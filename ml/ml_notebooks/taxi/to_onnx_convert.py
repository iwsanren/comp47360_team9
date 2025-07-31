# Importing.
import joblib
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# Loading model.
model = joblib.load("taxi_model.joblib")

# Defining number of features.
n_features = 22

# Defining input type expext by the model.
initial_type = [('input', FloatTensorType([None, n_features]))]

# Converting to ONNX.
onnx_model = convert_sklearn(model, initial_types=initial_type)

# Saving as ONNX.
with open("taxi_model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())

print("Model successfully converted to ONNX: taxi_model.onnx")