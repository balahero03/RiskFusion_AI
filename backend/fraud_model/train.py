import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
import joblib

def train_model():
    data_path = "D:/RiskFusion_AI/backend/fraud_model/processed_train.csv"
    print(f"Loading processed data from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Separate target and features
    y = df['isFraud']
    X = df.drop(columns=['isFraud', 'TransactionID', 'TransactionDT']) # Drop ID and Time
    
    print("Splitting data into 80% train and 20% test...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training XGBoost...")
    # scale_pos_weight helps handle imbalanced data (more 0s than 1s)
    scale_pos_weight = sum(y_train == 0) / sum(y_train == 1)
    
    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight, # Handles the imbalance
        missing=-999, # We filled numeric NaNs with -999 in preprocess
        random_state=42,
        tree_method='hist' # Faster on CPU
    )
    
    model.fit(X_train, y_train)
    
    model_path = "D:/RiskFusion_AI/backend/fraud_model/fraud_xgboost.pkl"
    print(f"Saving model to {model_path}...")
    joblib.dump(model, model_path)
    print("Model successfully saved!")

if __name__ == "__main__":
    train_model()
