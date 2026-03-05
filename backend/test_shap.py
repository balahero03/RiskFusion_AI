import joblib
import pandas as pd
bundle = joblib.load("credit_model/credit_fusion_model.joblib")
print(bundle.keys())
print(type(bundle['explainer']))
