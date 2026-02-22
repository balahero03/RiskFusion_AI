import joblib
import pandas as pd
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

class RiskFusionEngine:
    def __init__(self):
        # 1. Load the Fraud Model we just trained
        model_path = r"D:\fraud_model\fraud_xgboost.pkl"
        try:
            self.fraud_model = joblib.load(model_path)
        except Exception as e:
            print(f"Error loading model from {model_path}: {e}")
            self.fraud_model = None
        
        # 2. (Future) Load the Credit Model
        # self.credit_model = joblib.load("D:/RiskFusion_AI/backend/credit_model/credit_model.pkl")

    def _mock_credit_score(self, amount):
        # A fake credit score for now: higher transaction amounts slightly increase credit risk
        return min(amount / 5000.0, 0.99)

    def evaluate_transaction(self, transaction_data):
        """
        Takes raw transaction features, gets predictions from all models, 
        and fuses them into a final decision.
        """
        if self.fraud_model is None:
            return {"error": "Fraud model not loaded."}

        # --- MODEL 1: FRAUD ---
        # Predict probability of fraud (Class 1)
        fraud_prob = self.fraud_model.predict_proba(transaction_data)[0][1]
        
        # --- MODEL 2: CREDIT ---
        # Mocking it using the 'TransactionAmt' if it exists
        amount = transaction_data['TransactionAmt'].iloc[0] if 'TransactionAmt' in transaction_data.columns else 100.0
        credit_prob = self._mock_credit_score(amount)
        
        # --- FUSION LOGIC (Weighted Rule-Based) ---
        # Calculate a combined Fusion Score (e.g., Fraud is 70% of the risk, Credit is 30%)
        fusion_score = (fraud_prob * 0.7) + (credit_prob * 0.3)
        
        # Make a decision
        if fraud_prob > 0.80:
            decision = "DECLINE - HIGH FRAUD RISK"
        elif fusion_score > 0.65:
            decision = "MANUAL REVIEW - ELEVATED FUSION RISK"
        else:
            decision = "APPROVE"
            
        return {
            "fraud_probability": float(round(fraud_prob, 4)),
            "credit_default_probability": float(round(credit_prob, 4)),
            "fusion_risk_score": float(round(fusion_score, 4)),
            "final_decision": decision
        }

if __name__ == "__main__":
    print("Initializing Risk Fusion Engine...")
    engine = RiskFusionEngine()
    
    data_path = r"D:\fraud_model\processed_train.csv"
    print(f"Loading a sample transaction from {data_path}...")
    try:
        # Load ONE row from our processed test data to simulate a single transaction
        sample_data = pd.read_csv(data_path, nrows=1)
        # Drop the target and IDs just like during training
        features = sample_data.drop(columns=['isFraud', 'TransactionID', 'TransactionDT'])
        
        print("\nEvaluating Transaction...")
        result = engine.evaluate_transaction(features)
        
        print("\n" + "="*45)
        print("          🧠 FUSION ENGINE RESULT 🧠")
        print("="*45)
        for key, value in result.items():
            print(f"{key.replace('_', ' ').title().rjust(28)} : {value}")
        print("="*45)
    except Exception as e:
        print(f"Error during evaluation: {e}")
