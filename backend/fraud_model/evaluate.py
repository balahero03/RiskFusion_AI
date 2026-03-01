import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    precision_score, recall_score, f1_score
)
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate():
    print("Loading data, model, and selected features...")
    df = pd.read_csv("D:/RiskFusion_AI/backend/fraud_model/processed_train.csv")
    model = joblib.load("D:/RiskFusion_AI/backend/fraud_model/fraud_xgboost.pkl")
    selected_features = joblib.load("D:/RiskFusion_AI/backend/fraud_model/selected_features.pkl")
    
    y = df['isFraud']
    X = df.drop(columns=['isFraud', 'TransactionID', 'TransactionDT'])
    
    # Use only selected features (same as training)
    X = X[selected_features]
    
    # Recreate the SAME split used during training
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("Making predictions on test set...")
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # ── THRESHOLD TUNING ──────────────────────────────────────────────
    print("\n" + "="*60)
    print("        🎯 THRESHOLD TUNING")
    print("="*60)
    
    thresholds = [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]
    best_f1 = 0
    best_threshold = 0.5
    
    print(f"\n{'Threshold':>10s} | {'Precision':>10s} | {'Recall':>10s} | {'F1-Score':>10s}")
    print("-" * 50)
    
    for t in thresholds:
        y_pred_t = (y_prob >= t).astype(int)
        p = precision_score(y_test, y_pred_t, zero_division=0)
        r = recall_score(y_test, y_pred_t, zero_division=0)
        f1 = f1_score(y_test, y_pred_t, zero_division=0)
        print(f"    {t:.2f}   |   {p:.4f}   |   {r:.4f}   |   {f1:.4f}")
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = t
    
    print(f"\n✅ Best threshold by F1: {best_threshold:.2f} (F1={best_f1:.4f})")
    
    # Apply selected threshold
    y_pred = (y_prob >= best_threshold).astype(int)
    
    # ── MODEL EVALUATION ──────────────────────────────────────────────
    print("\n" + "="*60)
    print("        📊 MODEL EVALUATION")
    print("="*60)
    
    auc = roc_auc_score(y_test, y_prob)
    print(f"\n✅ ROC-AUC Score: {auc:.4f}")
    if auc > 0.85:
        print("   (Excellent score! Validates strong predictive power)")
    
    print(f"\n✅ Classification Report (threshold={best_threshold:.2f}):")
    print(classification_report(y_test, y_pred))
    
    # ── CONFUSION MATRIX ──────────────────────────────────────────────
    print("Generating Confusion Matrix Plot...")
    cm = confusion_matrix(y_test, y_pred)
    
    plt.figure(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Legitimate (0)', 'Fraud (1)'],
                yticklabels=['Legitimate (0)', 'Fraud (1)'])
    plt.title(f'Fraud Detection Confusion Matrix (threshold={best_threshold:.2f})')
    plt.ylabel('Actual Transaction Label')
    plt.xlabel('Predicted Transaction Label')
    plt.tight_layout()
    
    plot_path = "D:/RiskFusion_AI/backend/fraud_model/confusion_matrix.png"
    plt.savefig(plot_path)
    plt.close()
    print(f"✅ Saved confusion matrix to {plot_path}")
    
    # ── SHAP EXPLAINABILITY ───────────────────────────────────────────
    print("\n" + "="*60)
    print("        🔍 SHAP EXPLAINABILITY")
    print("="*60)
    
    try:
        import shap
        
        print("\nComputing SHAP values (this may take a moment)...")
        explainer = shap.TreeExplainer(model)
        
        # Use a sample for speed (up to 500 test rows)
        sample_size = min(500, len(X_test))
        X_sample = X_test.iloc[:sample_size]
        shap_values = explainer.shap_values(X_sample)
        
        # Global SHAP summary bar plot
        print("Generating global SHAP summary plot...")
        plt.figure(figsize=(10, 8))
        shap.summary_plot(shap_values, X_sample, plot_type="bar", show=False)
        plt.title("Global Feature Importance (SHAP)")
        plt.tight_layout()
        shap_summary_path = "D:/RiskFusion_AI/backend/fraud_model/shap_summary.png"
        plt.savefig(shap_summary_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"✅ Saved SHAP summary to {shap_summary_path}")
        
        # Single transaction explanation (waterfall plot)
        print("\nGenerating per-transaction SHAP explanation (row 0)...")
        plt.figure(figsize=(10, 6))
        shap_explanation = shap.Explanation(
            values=shap_values[0],
            base_values=explainer.expected_value,
            data=X_sample.iloc[0].values,
            feature_names=selected_features
        )
        shap.plots.waterfall(shap_explanation, show=False)
        plt.title("Per-Transaction SHAP Explanation (Sample Row 0)")
        plt.tight_layout()
        shap_single_path = "D:/RiskFusion_AI/backend/fraud_model/shap_single_transaction.png"
        plt.savefig(shap_single_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"✅ Saved single-transaction SHAP to {shap_single_path}")
        
    except ImportError:
        print("\n⚠️  SHAP not installed. Run: pip install shap")
        print("   Skipping SHAP plots. All other evaluation completed successfully.")
    except Exception as e:
        print(f"\n⚠️  SHAP error: {e}")
        print("   Skipping SHAP plots. All other evaluation completed successfully.")
    
    print("\n" + "="*60)
    print("  ✅ Evaluation complete!")
    print("="*60)

if __name__ == "__main__":
    evaluate()
