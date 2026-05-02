import os
import urllib.request

repo_id = "Xenova/whisper-tiny"
base_url = f"https://huggingface.co/{repo_id}/resolve/main/"
dest_dir = r"d:\Sakhi\public\models\Xenova\whisper-tiny"

files = [
    "config.json",
    "generation_config.json",
    "preprocessor_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "vocab.json",
    "merges.txt",
    "normalizer.json",
    "special_tokens_map.json",
    "onnx/encoder_model_quantized.onnx",
    "onnx/decoder_model_merged_quantized.onnx"
]

os.makedirs(os.path.join(dest_dir, "onnx"), exist_ok=True)

print("Downloading Whisper-tiny model files...")
for file in files:
    url = base_url + file
    dest_path = os.path.join(dest_dir, file.replace('/', '\\'))
    print(f"Downloading {file}...")
    try:
        urllib.request.urlretrieve(url, dest_path)
        print(f" -> Saved to {dest_path}")
    except Exception as e:
        print(f" -> Failed to download {file}: {e}")

print("Download complete!")
