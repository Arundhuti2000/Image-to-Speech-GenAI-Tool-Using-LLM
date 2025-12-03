import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

model_name = 'models/gemini-2.5-flash-preview-tts'

try:
    print("Attempt 1: response_mime_type='audio/mp3'")
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(
        "Hello, this is a test.",
        generation_config=genai.types.GenerationConfig(response_mime_type="audio/mp3")
    )
    print("Success!")
    print("Response parts:", len(response.parts))
    # print("Part 1:", response.parts[0]) 
    
except Exception as e:
    print("Error 1:", e)
