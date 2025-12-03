import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

model_name = 'models/gemini-2.5-flash-preview-tts'

try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hello, this is a test of the Gemini TTS model.")
    print("Response type:", type(response))
    print("Response parts:", response.parts)
    # Check if there is binary data or how audio is returned
except Exception as e:
    print("Error:", e)
