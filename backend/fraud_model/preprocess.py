import pandas as pd
import numpy as np
import os

def load_and_preprocess(data_dir="D:/fraud_data", nrows=100000):
    print(f"Loading first {nrows} rows of data from {data_dir}...")
    
    # Load limited rows for rapid iteration
    train_transaction = pd.read_csv(f"{data_dir}/train_transaction.csv", nrows=nrows)
    train_identity = pd.read_csv(f"{data_dir}/train_identity.csv", nrows=nrows)
    
    print("Merging data...")
    train = pd.merge(train_transaction, train_identity, on='TransactionID', how='left')
    
    print("Preprocessing categorical features...")
    # Get all categorical columns (object type)
    cat_cols = train.select_dtypes(include=['object']).columns
    
    # Simple Label Encoding: convert categoricals to numbers
    for col in cat_cols:
        train[col] = train[col].astype(str)
        # Convert to category codes. We add 1 so -1 (missing) becomes 0
        train[col] = train[col].astype('category').cat.codes + 1
    
    # Fill numeric NaNs with -999 so XGBoost recognizes them as missing
    num_cols = train.select_dtypes(exclude=['object', 'category']).columns
    train[num_cols] = train[num_cols].fillna(-999)
        
    print(f"Data shape after preprocessing: {train.shape}")
    
    # Save the processed data
    output_path = "D:/RiskFusion_AI/backend/fraud_model/processed_train.csv"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    train.to_csv(output_path, index=False)
    print(f"Saved processed data to {output_path}")

if __name__ == "__main__":
    os.makedirs("D:/RiskFusion_AI/backend/fraud_model", exist_ok=True)
    load_and_preprocess()
