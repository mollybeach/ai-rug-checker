import pandas as pd
from sklearn.ensemble import RandomForestClassifier

def train_model(data_path):
    data = pd.read_csv(data_path)
    X = data.drop("rug_pull", axis=1)
    y = data["rug_pull"]
    model = RandomForestClassifier()
    model.fit(X, y)
    return model
