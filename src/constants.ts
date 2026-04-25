export const COLAB_NOTEBOOK_CODE = `
# ADMET AI Research Pipeline: End-to-End Prediction with XAI
# Author: AI Studio ADMET Predictor
# This script is designed to run in Google Colab.

# 1. INSTALL LIBRARIES
!pip install rdkit shap lime xgboost pubchempy chembl_webresource_client tqdm scikit-learn matplotlib seaborn pandas

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from rdkit import Chem
from rdkit.Chem import Descriptors, AllChem, Draw
from rdkit.ML.Descriptors import MoleculeDescriptors
import pubchempy as pcp
from chembl_webresource_client.new_client import new_client
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from xgboost import XGBRegressor, XGBClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, mean_squared_error, r2_score
import shap
import lime
from lime import lime_tabular

# -----------------------------------
# 1. DATA COLLECTION MODULE
# -----------------------------------
def fetch_chembl_data(disease_name):
    print(f"Fetching ChEMBL data for: {disease_name}...")
    target = new_client.target
    activity = new_client.activity
    
    # Simple search for targets related to disease
    target_query = target.search(disease_name)
    if not target_query:
        return pd.DataFrame()
        
    target_id = target_query[0]['target_chembl_id']
    activities = activity.filter(target_chembl_id=target_id).filter(standard_type="IC50")
    
    df = pd.DataFrame.from_dict(activities)
    return df

def fetch_pubchem_data(compound_name):
    print(f"Fetching PubChem info for: {compound_name}...")
    try:
        compounds = pcp.get_compounds(compound_name, 'name')
        if not compounds: return None
        return compounds[0].canonical_smiles
    except:
        return None

# -----------------------------------
# 2. DATA PREPROCESSING
# -----------------------------------
def preprocess_data(df):
    if df.empty: return df
    # Clean SMILES
    df = df.dropna(subset=['canonical_smiles', 'standard_value'])
    df = df.drop_duplicates(subset=['canonical_smiles'])
    df['standard_value'] = pd.to_numeric(df['standard_value'])
    return df

# -----------------------------------
# 3. FEATURE ENGINEERING
# -----------------------------------
def generate_descriptors(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if not mol: return None
    
    calc = MoleculeDescriptors.MolecularDescriptorCalculator([x[0] for x in Descriptors._descList])
    desc = calc.CalcDescriptors(mol)
    return desc

def generate_fingerprints(smiles, radius=2, nBits=2048):
    mol = Chem.MolFromSmiles(smiles)
    if not mol: return None
    fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius, nBits=nBits)
    return np.array(fp)

# -----------------------------------
# 4. MODEL BUILDING & EVALUATION
# -----------------------------------
def train_and_evaluate(X, y, task='regression'):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    if task == 'regression':
        model = XGBRegressor(n_estimators=100)
    else:
        model = XGBClassifier(n_estimators=100)
        
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    
    print(f"--- {task.upper()} RESULTS ---")
    if task == 'regression':
        print(f"R2 Score: {r2_score(y_test, preds):.4f}")
        print(f"RMSE: {np.sqrt(mean_squared_error(y_test, preds)):.4f}")
    else:
        print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
        
    return model, X_train, X_test

# -----------------------------------
# 5. EXPLAINABLE AI (SHAP)
# -----------------------------------
def explain_model(model, X_train):
    explainer = shap.Explainer(model)
    shap_values = explainer(X_train)
    
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_train, show=False)
    plt.title("SHAP Feature Importance")
    plt.show()

# -----------------------------------
# MAIN EXECUTION THREAD (EXAMPLE)
# -----------------------------------
if __name__ == "__main__":
    # Example usage
    disease = "Diabetes" # User input
    # In a real run, you'd fetch data, engineer features, then train.
    print("Pipeline ready. Use individual modules to process specific compounds.")
`;
