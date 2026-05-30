import gradio as gr
import pandas as pd
import joblib
import datasets

inputs = [gr.Dataframe(row_count = (2, "dynamic"), col_count=(4,"dynamic"), label="Input Data", interactive=True)]

outputs = [gr.Dataframe(row_count = (2, "dynamic"), col_count=(1, "fixed"), label="Predictions", headers=["Failures"])]

model = joblib.load("../models/model.pkl") #model path

df = datasets.load_dataset("../data/processed/processed_data.csv")
df = df["train"].to_pandas()

def infer(input_dataframe):
  return pd.DataFrame(model.predict(input_dataframe))

UI=gr.Interface(fn = infer, inputs = inputs, outputs = outputs, examples = [[df.head(2)]])

UI.launch()