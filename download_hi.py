import os
import urllib.request

base_url = "https://huggingface.co/Xenova/whisper-small.hi/resolve/main/"
dest_dir = r"d:\Sakhi\public\models\whisper-small.hi"
os.makedirs(dest_dir, exist_ok=True)

files = [
    ("onnx/model_quantized.onnx", "onnx_model.onnx"),
    ("tokenizer.json", "tokenizer.json"),
    ("config.json", "config.json")
]

for src, dst in files:
    url = base_url + src
    dest_path = os.path.join(dest_dir, dst)
    print(f"Downloading {url} to {dest_path}...")
    urllib.request.urlretrieve(url, dest_path)
    print(f"Downloaded {dst}")
