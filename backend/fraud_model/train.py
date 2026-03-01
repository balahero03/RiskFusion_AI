import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from xgboost import XGBClassifier
import joblib

def train_model():
    data_path = "D:/RiskFusion_AI/backend/fraud_model/processed_train.csv"
    print(f"Loading processed data from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Separate target and features
    y = df['isFraud']
    X = df.drop(columns=['isFraud', 'TransactionID', 'TransactionDT'])  # Drop ID and Time
    
    print("Splitting data into 80% train and 20% test...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # ── PHASE 1: Train on full features for importance ranking ────────
    print("\n" + "="*50)
    print("  PHASE 1: Feature Importance (Full Feature Set)")
    print("="*50)
    
    scale_pos_weight = sum(y_train == 0) / sum(y_train == 1)
    
    full_model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight,
        missing=-999,
        random_state=42,
        tree_method='hist',
        eval_metric='logloss'
    )
    full_model.fit(X_train, y_train)
    
    # Extract gain-based feature importance
    importance = pd.Series(
        full_model.feature_importances_, index=X_train.columns
    ).sort_values(ascending=False)
    
    print("\n📊 Feature Importance Ranking (XGBoost Gain):")
    print("-" * 45)
    for i, (feat, imp) in enumerate(importance.items(), 1):
        marker = " ✅" if i <= 20 else ""
        print(f"  {i:3d}. {feat:<35s} {imp:.6f}{marker}")
    
    # Select top 20 features
    selected_features = importance.head(20).index.tolist()
    print(f"\n✅ Selected top {len(selected_features)} features for retraining.")
    
    # ── PHASE 2: Retrain with selected features ──────────────────────
    print("\n" + "="*50)
    print("  PHASE 2: Retrained Model (Selected Features)")
    print("="*50)
    
    X_train_sel = X_train[selected_features]
    X_test_sel = X_test[selected_features]
    
    # Tuned hyperparameters
    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        scale_pos_weight=scale_pos_weight,
        missing=-999,
        random_state=42,
        tree_method='hist',
        eval_metric='logloss'
    )
    
    # 5-Fold Stratified Cross-Validation
    print("\nRunning 5-Fold Stratified Cross-Validation...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(
        model, X_train_sel, y_train,
        cv=skf, scoring='roc_auc', n_jobs=-1
    )
    
    print(f"\n📈 Cross-Validation ROC-AUC Scores:")
    for i, score in enumerate(cv_scores, 1):
        print(f"  Fold {i}: {score:.4f}")
    print(f"  ──────────────────")
    print(f"  Mean:   {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    # Train final model on full training set
    print("\nTraining final model on full training set...")
    model.fit(X_train_sel, y_train)
    
    # Save model and selected features
    model_path = "D:/RiskFusion_AI/backend/fraud_model/fraud_xgboost.pkl"
    features_path = "D:/RiskFusion_AI/backend/fraud_model/selected_features.pkl"
    
    print(f"Saving model to {model_path}...")
    joblib.dump(model, model_path)
    
    print(f"Saving selected features to {features_path}...")
    joblib.dump(selected_features, features_path)
    
    print("\n✅ Model and feature list successfully saved!")

if __name__ == "__main__":
    train_model()
