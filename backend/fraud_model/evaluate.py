import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate():
    print("Loading data and model...")
    df = pd.read_csv("D:/RiskFusion_AI/backend/fraud_model/processed_train.csv")
    model = joblib.load("D:/RiskFusion_AI/backend/fraud_model/fraud_xgboost.pkl")
    
    y = df['isFraud']
    X = df.drop(columns=['isFraud', 'TransactionID', 'TransactionDT'])
    
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Making predictions on test set...")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    print("\n" + "="*40)
    print("        📊 MODEL EVALUATION 📊")
    print("="*40)
    
    auc = roc_auc_score(y_test, y_prob)
    print(f"\n✅ ROC-AUC Score: {auc:.4f}")
    if auc > 0.85:
        print("   (Excellent score! Validates strong predictive power)")
    
    print("\n✅ Classification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nGenerating Confusion Matrix Plot...")
    cm = confusion_matrix(y_test, y_pred)
    
    plt.figure(figsize=(7,5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=['Legitimate (0)', 'Fraud (1)'], 
                yticklabels=['Legitimate (0)', 'Fraud (1)'])
    plt.title('Fraud Detection Confusion Matrix\n(Higher numbers on diagonal = Better)')
    plt.ylabel('Actual Transaction Label')
    plt.xlabel('Predicted Transaction Label')
    plt.tight_layout()
    
    plot_path = "D:/RiskFusion_AI/backend/fraud_model/confusion_matrix.png"
    plt.savefig(plot_path)
    print(f"✅ Saved confusion matrix visual back to {plot_path}")
    print("="*40)
    
if __name__ == "__main__":
    evaluate()
