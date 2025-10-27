import os
import requests
from dotenv import load_dotenv

load_dotenv()
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")

# List of TTS models to try
tts_models = [
    "espnet/kan-bayashi_ljspeech_vits",  # Original (might be broken)
    "facebook/mms-tts-eng",  # Facebook's TTS
    "microsoft/speecht5_tts",  # Microsoft's TTS
    "suno/bark-small",  # Bark TTS
    "kakao-enterprise/vits-ljs",  # Alternative VITS
]

test_text = "Hello, this is a test."

print("Testing TTS Models on HuggingFace")
print("="*60)

for model in tts_models:
    print(f"\nTesting: {model}")
    print("-"*60)
    
    API_URL = f"https://api-inference.huggingface.co/models/{model}"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}
    payload = {"inputs": test_text}
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ SUCCESS! Model works!")
            print(f"   Content-Type: {response.headers.get('Content-Type')}")
            print(f"   Content Length: {len(response.content)} bytes")
        elif response.status_code == 503:
            print(f"⏳ Model is loading... (try again in a moment)")
        elif response.status_code == 404:
            print(f"❌ Model not found or unavailable")
        else:
            print(f"❌ Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

print("\n" + "="*60)
print("RECOMMENDATION: Use the model that shows ✅ SUCCESS")
