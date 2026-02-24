import os
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, accuracy_score

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "fraud_model", "fraud_xgboost.pkl")
DATA_PATH = os.path.join(BASE_DIR, "fraud_model", "processed_train.csv")
CONFUSION_IMG = os.path.join(BASE_DIR, "fraud_model", "confusion_matrix.png")

# Load model once at startup
model = None
feature_names = []

def load_model():
    global model, feature_names
    try:
        model = joblib.load(MODEL_PATH)
        feature_names = list(model.feature_names_in_)
        print(f"Model loaded: {len(feature_names)} features")
    except Exception as e:
        print(f"Failed to load model: {e}")

load_model()

# Human-readable labels for key features
FEATURE_LABELS = {
    "TransactionAmt": "Transaction Amount ($)",
    "ProductCD": "Product Code (1=W, 2=H, 3=C, 4=S, 5=R)",
    "card4": "Card Brand (1=Visa, 2=Mastercard, 3=Amex, 4=Discover)",
    "card6": "Card Type (1=Debit, 2=Credit, 3=Charge)",
    "P_emaildomain": "Payer Email Domain (encoded)",
    "R_emaildomain": "Receiver Email Domain (encoded)",
    "addr1": "Billing Address Region",
    "addr2": "Billing Country Code",
    "dist1": "Distance Metric",
    "C1": "Count Feature C1",
    "C2": "Count Feature C2",
    "C4": "Count Feature C4 (top importance)",
    "C8": "Count Feature C8 (top importance)",
    "C12": "Count Feature C12",
    "C14": "Count Feature C14",
    "D1": "Timedelta D1",
    "D2": "Timedelta D2",
    "M4": "Match Feature M4 (top importance)",
    "DeviceType": "Device Type (1=Desktop, 2=Mobile)",
    "DeviceInfo": "Device Info (encoded)",
    "card1": "Card ID 1",
    "card2": "Card ID 2",
    "card3": "Card Dimensions 3",
    "card5": "Card Dimensions 5",
    "id_01": "Identity Feature 01",
    "id_02": "Identity Feature 02",
}

# Fields the UI will collect
UI_FIELDS = [
    {"name": "TransactionAmt", "label": "Transaction Amount ($)", "type": "number", "placeholder": "e.g. 150.00", "group": "Transaction"},
    {"name": "ProductCD", "label": "Product Code", "type": "select", "options": [
        {"value": 1, "label": "W — Web"},
        {"value": 2, "label": "H — Hotel"},
        {"value": 3, "label": "C — Check"},
        {"value": 4, "label": "S — Store"},
        {"value": 5, "label": "R — Recurring"},
    ], "group": "Transaction"},
    {"name": "card4", "label": "Card Brand", "type": "select", "options": [
        {"value": 1, "label": "Visa"},
        {"value": 2, "label": "Mastercard"},
        {"value": 3, "label": "American Express"},
        {"value": 4, "label": "Discover"},
    ], "group": "Card"},
    {"name": "card6", "label": "Card Type", "type": "select", "options": [
        {"value": 1, "label": "Debit"},
        {"value": 2, "label": "Credit"},
        {"value": 3, "label": "Charge"},
    ], "group": "Card"},
    {"name": "card1", "label": "Card Identifier", "type": "number", "placeholder": "e.g. 10000", "group": "Card"},
    {"name": "card2", "label": "Card Detail 2", "type": "number", "placeholder": "e.g. 200", "group": "Card"},
    {"name": "addr1", "label": "Billing Region Code", "type": "number", "placeholder": "e.g. 315", "group": "Address"},
    {"name": "addr2", "label": "Billing Country", "type": "number", "placeholder": "e.g. 87", "group": "Address"},
    {"name": "dist1", "label": "Distance", "type": "number", "placeholder": "e.g. 50", "group": "Address"},
    {"name": "P_emaildomain", "label": "Payer Email Domain", "type": "select", "options": [
        {"value": 1, "label": "gmail.com"},
        {"value": 2, "label": "yahoo.com"},
        {"value": 3, "label": "hotmail.com"},
        {"value": 4, "label": "outlook.com"},
        {"value": 5, "label": "Other"},
    ], "group": "Email"},
    {"name": "C1", "label": "Count C1", "type": "number", "placeholder": "e.g. 1", "group": "Counts"},
    {"name": "C2", "label": "Count C2", "type": "number", "placeholder": "e.g. 1", "group": "Counts"},
    {"name": "C4", "label": "Count C4", "type": "number", "placeholder": "e.g. 0", "group": "Counts"},
    {"name": "C8", "label": "Count C8", "type": "number", "placeholder": "e.g. 0", "group": "Counts"},
    {"name": "C14", "label": "Count C14", "type": "number", "placeholder": "e.g. 1", "group": "Counts"},
    {"name": "D1", "label": "Timedelta D1", "type": "number", "placeholder": "e.g. 14", "group": "Timedeltas"},
    {"name": "M4", "label": "Match M4", "type": "select", "options": [
        {"value": 1, "label": "T (True)"},
        {"value": 2, "label": "F (False)"},
    ], "group": "Match"},
    {"name": "DeviceType", "label": "Device Type", "type": "select", "options": [
        {"value": 1, "label": "Desktop"},
        {"value": 2, "label": "Mobile"},
    ], "group": "Device"},
]


@app.route("/api/fraud/predict", methods=["POST"])
def predict_fraud():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.get_json(force=True)

    # Build a row with all 431 features, default -999 (model's missing value)
    row = {f: -999 for f in feature_names}

    # Fill in user-supplied values
    for key, val in data.items():
        if key in row:
            try:
                row[key] = float(val)
            except (ValueError, TypeError):
                row[key] = -999

    df = pd.DataFrame([row], columns=feature_names)
    prob = float(model.predict_proba(df)[0][1])
    pred = int(model.predict(df)[0])

    if prob > 0.80:
        decision = "DECLINE"
        risk_level = "Critical"
    elif prob > 0.50:
        decision = "DECLINE"
        risk_level = "High"
    elif prob > 0.30:
        decision = "REVIEW"
        risk_level = "Medium"
    elif prob > 0.10:
        decision = "REVIEW"
        risk_level = "Low-Medium"
    else:
        decision = "APPROVE"
        risk_level = "Low"

    return jsonify({
        "fraud_probability": round(prob, 6),
        "fraud_percentage": round(prob * 100, 2),
        "prediction": pred,
        "decision": decision,
        "risk_level": risk_level,
    })


@app.route("/api/fraud/model-info", methods=["GET"])
def model_info():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    params = model.get_params()
    imp = model.feature_importances_
    top_idx = np.argsort(imp)[::-1][:25]
    top_features = [
        {"name": feature_names[i], "importance": round(float(imp[i]), 6),
         "label": FEATURE_LABELS.get(feature_names[i], feature_names[i])}
        for i in top_idx
    ]

    return jsonify({
        "model_type": "XGBClassifier (XGBoost)",
        "feature_count": len(feature_names),
        "hyperparameters": {
            "n_estimators": params.get("n_estimators"),
            "max_depth": params.get("max_depth"),
            "learning_rate": params.get("learning_rate"),
            "tree_method": params.get("tree_method"),
            "random_state": params.get("random_state"),
            "scale_pos_weight": round(float(params.get("scale_pos_weight", 0)), 2),
            "missing_value": -999,
        },
        "top_features": top_features,
        "ui_fields": UI_FIELDS,
        "training_data": "IEEE CIS Fraud Detection (100K rows)",
    })


@app.route("/api/fraud/evaluate", methods=["GET"])
def evaluate_model():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    if not os.path.exists(DATA_PATH):
        return jsonify({"error": "Processed training data not found"}), 404

    try:
        df = pd.read_csv(DATA_PATH)
        y = df["isFraud"]
        X = df.drop(columns=["isFraud", "TransactionID", "TransactionDT"])

        _, X_test, _, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        auc = float(roc_auc_score(y_test, y_prob))
        acc = float(accuracy_score(y_test, y_pred))
        cm = confusion_matrix(y_test, y_pred).tolist()
        report = classification_report(y_test, y_pred, output_dict=True)

        # Clean up report for JSON
        metrics = {}
        for label in ["0", "1", "macro avg", "weighted avg"]:
            if label in report:
                metrics[label] = {
                    k: round(v, 4) for k, v in report[label].items()
                }

        return jsonify({
            "accuracy": round(acc, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": cm,
            "classification_report": metrics,
            "test_size": len(y_test),
            "fraud_count_test": int(y_test.sum()),
            "legit_count_test": int((y_test == 0).sum()),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/fraud/confusion-matrix", methods=["GET"])
def get_confusion_matrix():
    if os.path.exists(CONFUSION_IMG):
        return send_file(CONFUSION_IMG, mimetype="image/png")
    return jsonify({"error": "Image not found"}), 404


if __name__ == "__main__":
    app.run(debug=True, port=5000)
