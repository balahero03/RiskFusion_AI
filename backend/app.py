import os
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, accuracy_score

try:
    import joblib
except ImportError:
    joblib = None

app = Flask(__name__)
CORS(app)

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH    = os.path.join(BASE_DIR, "fraud_model",  "fraud_xgboost.pkl")
DATA_PATH     = os.path.join(BASE_DIR, "fraud_model",  "processed_train.csv")
CONFUSION_IMG = os.path.join(BASE_DIR, "fraud_model",  "confusion_matrix.png")
CREDIT_MODEL_PATH    = os.path.join(BASE_DIR, "credit_model", "credit_xgb_model.joblib")
CREDIT_PIPELINE_PATH = os.path.join(BASE_DIR, "credit_model", "preprocessing_pipeline.joblib")
CUSTOMERS_PATH = os.path.join(BASE_DIR, "..", "data", "customers.csv")

OCCUPATION_LABELS = {
    0:"Laborers",1:"Core Staff",2:"Accountants",3:"Managers",4:"Drivers",
    5:"Sales Staff",6:"Cleaning Staff",7:"Cooking Staff",8:"Private Service Staff",
    9:"Medicine Staff",10:"Security Staff",11:"High Skill Tech Staff",
    12:"Waiters/Barmen",13:"Low-Skill Laborers",14:"Realty Agents",
    15:"Secretaries",16:"IT Staff",17:"HR Staff",
}
EDUCATION_LABELS  = {0:"Lower Secondary",1:"Secondary",2:"Incomplete Higher",3:"Higher Education",4:"Academic Degree"}
FAMILY_LABELS     = {0:"Single",1:"Married",2:"Civil Marriage",3:"Widow",4:"Separated"}
INCOME_TYPE_LABELS= {0:"Working",1:"State Servant",2:"Commercial Associate",3:"Pensioner",4:"Unemployed",5:"Student"}

# ---------- helpers ----------
def _load_joblib(path):
    """Load a joblib/pickle file using whatever is available."""
    if joblib is not None:
        return joblib.load(path)
    with open(path, "rb") as f:
        return pickle.load(f)

# ---------- Fraud model ----------
model = None
feature_names = []

def load_model():
    global model, feature_names
    try:
        model = _load_joblib(MODEL_PATH)
        feature_names = list(model.feature_names_in_)
        print(f"Fraud model loaded: {len(feature_names)} features")
    except Exception as e:
        print(f"Failed to load fraud model: {e}")

load_model()

# ---------- Credit model ----------
credit_model = None
credit_feature_cols = []
credit_threshold = 0.69
credit_metrics = {}

def load_credit_model():
    global credit_model, credit_feature_cols, credit_threshold, credit_metrics
    try:
        credit_model = _load_joblib(CREDIT_MODEL_PATH)
        meta = _load_joblib(CREDIT_PIPELINE_PATH)
        credit_feature_cols = list(meta.get("feature_cols", []))
        credit_threshold = float(meta.get("best_threshold", 0.69))
        credit_metrics = meta.get("metrics", {})
        print(f"Credit model loaded: {len(credit_feature_cols)} features, threshold={credit_threshold}")
    except Exception as e:
        print(f"Failed to load credit model: {e}")

load_credit_model()

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


# ============================================================
#  CREDIT MODEL ENDPOINTS
# ============================================================

CREDIT_UI_FIELDS = [
    # --- Applicant ---
    {"name": "NAME_CONTRACT_TYPE", "label": "Contract Type", "group": "Applicant", "type": "select",
     "options": [{"value": 0, "label": "Cash Loans"}, {"value": 1, "label": "Revolving Loans"}]},
    {"name": "CODE_GENDER", "label": "Gender", "group": "Applicant", "type": "select",
     "options": [{"value": 0, "label": "Female"}, {"value": 1, "label": "Male"}]},
    {"name": "FLAG_OWN_CAR", "label": "Owns a Car", "group": "Applicant", "type": "select",
     "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}]},
    {"name": "FLAG_OWN_REALTY", "label": "Owns Property", "group": "Applicant", "type": "select",
     "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}]},
    {"name": "CNT_CHILDREN", "label": "Number of Children", "group": "Applicant", "type": "number", "placeholder": "e.g. 0"},
    {"name": "CNT_FAM_MEMBERS", "label": "Family Members", "group": "Applicant", "type": "number", "placeholder": "e.g. 2"},
    {"name": "AGE_YEARS", "label": "Age (years)", "group": "Applicant", "type": "number", "placeholder": "e.g. 35"},
    {"name": "NAME_EDUCATION_TYPE", "label": "Education Level", "group": "Applicant", "type": "select",
     "options": [{"value": 0, "label": "Lower Secondary"}, {"value": 1, "label": "Secondary / Secondary Special"},
                 {"value": 2, "label": "Incomplete Higher"}, {"value": 3, "label": "Higher Education"},
                 {"value": 4, "label": "Academic Degree"}]},
    {"name": "NAME_FAMILY_STATUS", "label": "Family Status", "group": "Applicant", "type": "select",
     "options": [{"value": 0, "label": "Single / Not Married"}, {"value": 1, "label": "Married"},
                 {"value": 2, "label": "Civil Marriage"}, {"value": 3, "label": "Widow"},
                 {"value": 4, "label": "Separated"}]},
    # --- Income & Loan ---
    {"name": "AMT_INCOME_TOTAL", "label": "Annual Income ($)", "group": "Income & Loan", "type": "number", "placeholder": "e.g. 180000"},
    {"name": "AMT_CREDIT", "label": "Loan Credit Amount ($)", "group": "Income & Loan", "type": "number", "placeholder": "e.g. 450000"},
    {"name": "AMT_ANNUITY", "label": "Loan Annuity ($)", "group": "Income & Loan", "type": "number", "placeholder": "e.g. 20000"},
    {"name": "AMT_GOODS_PRICE", "label": "Goods Price ($)", "group": "Income & Loan", "type": "number", "placeholder": "e.g. 450000"},
    {"name": "NAME_INCOME_TYPE", "label": "Income Type", "group": "Income & Loan", "type": "select",
     "options": [{"value": 0, "label": "Working"}, {"value": 1, "label": "State Servant"},
                 {"value": 2, "label": "Commercial Associate"}, {"value": 3, "label": "Pensioner"},
                 {"value": 4, "label": "Unemployed"}, {"value": 5, "label": "Student"}]},
    # --- Employment ---
    {"name": "EMPLOYED_YEARS", "label": "Years Employed", "group": "Employment", "type": "number", "placeholder": "e.g. 5"},
    {"name": "DAYS_REGISTRATION", "label": "Days Since Registration", "group": "Employment", "type": "number", "placeholder": "e.g. -2000"},
    {"name": "DAYS_ID_PUBLISH", "label": "Days Since ID Change", "group": "Employment", "type": "number", "placeholder": "e.g. -1000"},
    {"name": "OCCUPATION_TYPE", "label": "Occupation Type", "group": "Employment", "type": "select",
     "options": [{"value": 0, "label": "Laborers"}, {"value": 1, "label": "Core Staff"},
                 {"value": 2, "label": "Accountants"}, {"value": 3, "label": "Managers"},
                 {"value": 4, "label": "Drivers"}, {"value": 5, "label": "Sales Staff"},
                 {"value": 6, "label": "Cleaning Staff"}, {"value": 7, "label": "Cooking Staff"},
                 {"value": 8, "label": "Private Service Staff"}, {"value": 9, "label": "Medicine Staff"},
                 {"value": 10, "label": "Security Staff"}, {"value": 11, "label": "High Skill Tech Staff"},
                 {"value": 12, "label": "Waiters/Barmen"}, {"value": 13, "label": "Low-Skill Laborers"},
                 {"value": 14, "label": "Realty Agents"}, {"value": 15, "label": "Secretaries"},
                 {"value": 16, "label": "IT Staff"}, {"value": 17, "label": "HR Staff"}]},
    # --- External Scores ---
    {"name": "EXT_SOURCE_1", "label": "External Score 1", "group": "Credit Scores", "type": "number", "placeholder": "0.0 – 1.0, e.g. 0.50"},
    {"name": "EXT_SOURCE_2", "label": "External Score 2", "group": "Credit Scores", "type": "number", "placeholder": "0.0 – 1.0, e.g. 0.60"},
    {"name": "EXT_SOURCE_3", "label": "External Score 3", "group": "Credit Scores", "type": "number", "placeholder": "0.0 – 1.0, e.g. 0.55"},
    # --- Bureau ---
    {"name": "bureau_num_loans", "label": "# Bureau Loans", "group": "Bureau History", "type": "number", "placeholder": "e.g. 3"},
    {"name": "bureau_total_debt", "label": "Total Bureau Debt ($)", "group": "Bureau History", "type": "number", "placeholder": "e.g. 50000"},
    {"name": "bureau_total_credit", "label": "Total Bureau Credit ($)", "group": "Bureau History", "type": "number", "placeholder": "e.g. 200000"},
    {"name": "bureau_active_loan_count", "label": "Active Bureau Loans", "group": "Bureau History", "type": "number", "placeholder": "e.g. 1"},
    {"name": "bureau_max_overdue", "label": "Max Overdue Days", "group": "Bureau History", "type": "number", "placeholder": "e.g. 0"},
    # --- Previous Applications ---
    {"name": "prev_application_count", "label": "Previous Applications", "group": "Previous Apps", "type": "number", "placeholder": "e.g. 2"},
    {"name": "prev_approved_count", "label": "Previously Approved", "group": "Previous Apps", "type": "number", "placeholder": "e.g. 1"},
    {"name": "prev_refused_count", "label": "Previously Refused", "group": "Previous Apps", "type": "number", "placeholder": "e.g. 0"},
    {"name": "prev_approval_rate", "label": "Approval Rate (0-1)", "group": "Previous Apps", "type": "number", "placeholder": "e.g. 0.5"},
    # --- Installments ---
    {"name": "installments_late_count", "label": "Late Installments", "group": "Payment History", "type": "number", "placeholder": "e.g. 0"},
    {"name": "installments_avg_delay", "label": "Avg Payment Delay (days)", "group": "Payment History", "type": "number", "placeholder": "e.g. 0"},
    {"name": "installments_late_pct", "label": "Late Payment %", "group": "Payment History", "type": "number", "placeholder": "e.g. 0.0"},
    # --- Credit Card ---
    {"name": "cc_avg_balance", "label": "Avg CC Balance ($)", "group": "Credit Card", "type": "number", "placeholder": "e.g. 5000"},
    {"name": "cc_avg_utilization", "label": "Avg CC Utilization (0-1)", "group": "Credit Card", "type": "number", "placeholder": "e.g. 0.3"},
    {"name": "cc_over_limit_count", "label": "Over-Limit Events", "group": "Credit Card", "type": "number", "placeholder": "e.g. 0"},
]


@app.route("/api/credit/model-info", methods=["GET"])
def credit_model_info():
    if credit_model is None:
        return jsonify({"error": "Credit model not loaded"}), 500
    return jsonify({
        "model_type": "XGBClassifier (XGBoost)",
        "feature_count": len(credit_feature_cols),
        "threshold": credit_threshold,
        "metrics": credit_metrics,
        "training_data": "Home Credit Default Risk (Kaggle)",
        "ui_fields": CREDIT_UI_FIELDS,
    })


@app.route("/api/credit/predict", methods=["POST"])
def predict_credit():
    if credit_model is None:
        return jsonify({"error": "Credit model not loaded"}), 500

    data = request.get_json(force=True)

    # Build a NaN-filled row with all 146 features
    row = {f: np.nan for f in credit_feature_cols}

    # Fill in user-supplied values
    for key, val in data.items():
        if key in row:
            try:
                row[key] = float(val)
            except (ValueError, TypeError):
                row[key] = np.nan

    df = pd.DataFrame([row], columns=credit_feature_cols)
    prob = float(credit_model.predict_proba(df)[0][1])

    # Apply the tuned threshold
    pred = int(prob >= credit_threshold)

    # Business decision tiers
    if prob >= 0.80:
        decision = "DECLINE"
        risk_level = "Very High"
    elif prob >= credit_threshold:
        decision = "DECLINE"
        risk_level = "High"
    elif prob >= 0.40:
        decision = "REVIEW"
        risk_level = "Medium"
    elif prob >= 0.20:
        decision = "REVIEW"
        risk_level = "Low-Medium"
    else:
        decision = "APPROVE"
        risk_level = "Low"

    return jsonify({
        "default_probability": round(prob, 6),
        "default_percentage": round(prob * 100, 2),
        "prediction": pred,
        "decision": decision,
        "risk_level": risk_level,
        "threshold_used": credit_threshold,
    })


# ============================================================
#  FUSION MODEL ENDPOINTS
# ============================================================

FUSION_WEIGHTS = {
    "loan":        {"credit": 0.70, "fraud": 0.30},
    "transaction": {"credit": 0.40, "fraud": 0.60},
    "limit":       {"credit": 0.50, "fraud": 0.50},
}


@app.route("/api/fusion/model-info", methods=["GET"])
def fusion_model_info():
    return jsonify({
        "contexts": [
            {"key": "loan",        "label": "Loan Approval",        "credit_weight": 0.70, "fraud_weight": 0.30},
            {"key": "transaction", "label": "Transaction Auth.",     "credit_weight": 0.40, "fraud_weight": 0.60},
            {"key": "limit",       "label": "Credit Limit Increase", "credit_weight": 0.50, "fraud_weight": 0.50},
        ],
        "decision_tiers": [
            {"range": "0 – 25%",   "level": "Low",        "decision": "APPROVE"},
            {"range": "25 – 45%",  "level": "Low-Medium", "decision": "REVIEW"},
            {"range": "45 – 65%",  "level": "Medium",     "decision": "REVIEW"},
            {"range": "65 – 80%",  "level": "High",       "decision": "DECLINE"},
            {"range": "80 – 100%", "level": "Very High",  "decision": "DECLINE"},
        ],
        "description": (
            "RiskFusion combines the XGBoost Fraud Detection model (IEEE CIS, 431 features) "
            "with the XGBoost Credit Default model (Home Credit, 146 features) into a single "
            "weighted Fusion Risk Score. Weights are adjusted per evaluation context."
        ),
        "models_loaded": {
            "fraud":  model is not None,
            "credit": credit_model is not None,
        },
    })


@app.route("/api/fusion/predict", methods=["POST"])
def predict_fusion():
    if model is None or credit_model is None:
        return jsonify({"error": "One or more models not loaded"}), 500

    data = request.get_json(force=True)
    context = str(data.get("context", "loan")).lower()
    weights = FUSION_WEIGHTS.get(context, FUSION_WEIGHTS["loan"])

    # --- Fraud model ---
    fraud_row = {f: -999 for f in feature_names}
    for key, val in data.items():
        if key in fraud_row:
            try:
                fraud_row[key] = float(val)
            except (ValueError, TypeError):
                fraud_row[key] = -999
    fraud_df = pd.DataFrame([fraud_row], columns=feature_names)
    fraud_prob = float(model.predict_proba(fraud_df)[0][1])

    # --- Credit model ---
    credit_row = {f: np.nan for f in credit_feature_cols}
    for key, val in data.items():
        if key in credit_row:
            try:
                credit_row[key] = float(val)
            except (ValueError, TypeError):
                credit_row[key] = np.nan
    credit_df = pd.DataFrame([credit_row], columns=credit_feature_cols)
    credit_prob = float(credit_model.predict_proba(credit_df)[0][1])

    # --- Loss-Aware Fusion ---
    LGD         = 0.6
    txn_amount  = float(data.get("TransactionAmt", 0) or 0)
    loan_amount = float(data.get("AMT_CREDIT", 0) or 0)
    fraud_risk  = fraud_prob * txn_amount
    credit_risk = credit_prob * loan_amount * LGD
    total_risk  = fraud_risk + credit_risk
    exposure    = max(loan_amount + txn_amount, 1)
    risk_ratio  = total_risk / exposure

    if risk_ratio < 0.10:
        decision, risk_level = "APPROVE", "Low"
    elif risk_ratio < 0.25:
        decision, risk_level = "REVIEW",  "Medium"
    else:
        decision, risk_level = "REJECT",  "High"

    return jsonify({
        "fraud_probability":  round(fraud_prob, 6),
        "fraud_percentage":   round(fraud_prob * 100, 2),
        "credit_probability": round(credit_prob, 6),
        "credit_percentage":  round(credit_prob * 100, 2),
        "fraud_risk":         round(fraud_risk, 2),
        "credit_risk":        round(credit_risk, 2),
        "total_risk":         round(total_risk, 2),
        "exposure":           round(exposure, 2),
        "risk_ratio":         round(risk_ratio, 6),
        "risk_ratio_pct":     round(risk_ratio * 100, 2),
        "lgd":                LGD,
        "txn_amount":         txn_amount,
        "loan_amount":        loan_amount,
        "context":            context,
        "decision":           decision,
        "risk_level":         risk_level,
    })


# ============================================================
#  DEMO MODE ENDPOINTS  (Hackathon bank-product demo)
# ============================================================

def _load_customers():
    path = os.path.normpath(CUSTOMERS_PATH)
    return pd.read_csv(path)


@app.route("/api/demo/customers", methods=["GET"])
def demo_customers():
    try:
        df = _load_customers()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    customers = []
    for _, r in df.iterrows():
        ext_avg = round((float(r.ext_score_1) + float(r.ext_score_2) + float(r.ext_score_3)) / 3, 3)
        customers.append({
            "customer_id":        r.customer_id,
            "name":               r["name"],
            "account_number":     r.account_number,
            "account_type":       r.account_type,
            "bank_name":          r.bank_name,
            "age":                int(r.age),
            "gender":             "Male" if int(r.gender) == 1 else "Female",
            "income":             float(r.income),
            "loan_amount":        float(r.loan_amount),
            "employment_years":   float(r.employment_years),
            "education":          EDUCATION_LABELS.get(int(r.education), str(r.education)),
            "family_status":      FAMILY_LABELS.get(int(r.family_status), str(r.family_status)),
            "income_type":        INCOME_TYPE_LABELS.get(int(r.income_type), str(r.income_type)),
            "occupation":         OCCUPATION_LABELS.get(int(r.occupation_type), str(r.occupation_type)),
            "ext_score_avg":      ext_avg,
            "bureau_max_overdue": int(r.bureau_max_overdue),
            "late_installments":  int(r.late_installments),
            "cc_utilization":     float(r.cc_utilization),
            "last_transaction":   float(r.last_transaction_amt),
            "risk_profile":       r.risk_profile,
            "owns_car":           bool(int(r.owns_car)),
            "owns_realty":        bool(int(r.owns_realty)),
            "children":           int(r.children),
        })
    return jsonify(customers)


@app.route("/api/demo/assess", methods=["POST"])
def demo_assess():
    if model is None or credit_model is None:
        return jsonify({"error": "One or more models not loaded"}), 500

    data        = request.get_json(force=True)
    customer_id = data.get("customer_id")
    context     = str(data.get("context", "loan")).lower()

    try:
        df  = _load_customers()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    rows = df[df["customer_id"] == customer_id]
    if rows.empty:
        return jsonify({"error": "Customer not found"}), 404
    r = rows.iloc[0]

    weights = FUSION_WEIGHTS.get(context, FUSION_WEIGHTS["loan"])

    # ── Credit model features ─────────────────────────────
    credit_map = {
        "AMT_INCOME_TOTAL":        float(r.income),
        "AMT_CREDIT":              float(r.loan_amount),
        "AMT_ANNUITY":             float(r.annuity),
        "AMT_GOODS_PRICE":         float(r.goods_price),
        "AGE_YEARS":               float(r.age),
        "EMPLOYED_YEARS":          float(r.employment_years),
        "CODE_GENDER":             float(r.gender),
        "FLAG_OWN_CAR":            float(r.owns_car),
        "FLAG_OWN_REALTY":         float(r.owns_realty),
        "CNT_CHILDREN":            float(r.children),
        "CNT_FAM_MEMBERS":         float(r.family_members),
        "NAME_EDUCATION_TYPE":     float(r.education),
        "NAME_FAMILY_STATUS":      float(r.family_status),
        "NAME_INCOME_TYPE":        float(r.income_type),
        "OCCUPATION_TYPE":         float(r.occupation_type),
        "DAYS_REGISTRATION":       float(r.days_registration),
        "DAYS_ID_PUBLISH":         float(r.days_id_publish),
        "EXT_SOURCE_1":            float(r.ext_score_1),
        "EXT_SOURCE_2":            float(r.ext_score_2),
        "EXT_SOURCE_3":            float(r.ext_score_3),
        "bureau_num_loans":        float(r.bureau_loans),
        "bureau_total_debt":       float(r.bureau_debt),
        "bureau_total_credit":     float(r.bureau_credit),
        "bureau_active_loan_count":float(r.bureau_active_loans),
        "bureau_max_overdue":      float(r.bureau_max_overdue),
        "prev_application_count":  float(r.prev_applications),
        "prev_approved_count":     float(r.prev_approved),
        "prev_refused_count":      float(r.prev_refused),
        "prev_approval_rate":      float(r.approval_rate),
        "installments_late_count": float(r.late_installments),
        "installments_avg_delay":  float(r.avg_delay),
        "installments_late_pct":   float(r.late_pct),
        "cc_avg_balance":          float(r.cc_balance),
        "cc_avg_utilization":      float(r.cc_utilization),
        "cc_over_limit_count":     float(r.cc_over_limit),
    }
    credit_row = {f: np.nan for f in credit_feature_cols}
    for k, v in credit_map.items():
        if k in credit_row:
            credit_row[k] = v
    credit_df  = pd.DataFrame([credit_row], columns=credit_feature_cols)
    credit_prob= float(credit_model.predict_proba(credit_df)[0][1])

    # ── Fraud model features ──────────────────────────────
    fraud_row = {f: -999 for f in feature_names}
    fraud_map = {
        "TransactionAmt": float(r.last_transaction_amt),
        "card4":          float(r.card_brand),
        "card6":          float(r.card_type),
        "ProductCD":      float(r.product_code),
        "DeviceType":     float(r.device_type),
        "AMT_INCOME_TOTAL": float(r.income),   # some V-features correlate
    }
    for k, v in fraud_map.items():
        if k in fraud_row:
            fraud_row[k] = v
    fraud_df  = pd.DataFrame([fraud_row], columns=feature_names)
    fraud_prob= float(model.predict_proba(fraud_df)[0][1])

    # ── Loss-Aware Fusion ─────────────────────────────────
    LGD          = 0.6
    txn_amount   = float(r.last_transaction_amt)
    loan_amount  = float(r.loan_amount)
    fraud_risk   = fraud_prob * txn_amount
    credit_risk  = credit_prob * loan_amount * LGD
    total_risk   = fraud_risk + credit_risk
    exposure     = max(loan_amount + txn_amount, 1)
    risk_ratio   = total_risk / exposure

    if risk_ratio < 0.10:
        decision, risk_level = "APPROVE", "Low"
    elif risk_ratio < 0.25:
        decision, risk_level = "REVIEW",  "Medium"
    else:
        decision, risk_level = "REJECT",  "High"

    return jsonify({
        "fraud_probability":  round(fraud_prob, 6),
        "fraud_percentage":   round(fraud_prob * 100, 2),
        "credit_probability": round(credit_prob, 6),
        "credit_percentage":  round(credit_prob * 100, 2),
        "fraud_risk":         round(fraud_risk, 2),
        "credit_risk":        round(credit_risk, 2),
        "total_risk":         round(total_risk, 2),
        "exposure":           round(exposure, 2),
        "risk_ratio":         round(risk_ratio, 6),
        "risk_ratio_pct":     round(risk_ratio * 100, 2),
        "lgd":                LGD,
        "txn_amount":         txn_amount,
        "loan_amount_used":   loan_amount,
        "context":            context,
        "decision":           decision,
        "risk_level":         risk_level,
        "risk_factors":       factors,
        "customer_name":      r["name"],
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)

