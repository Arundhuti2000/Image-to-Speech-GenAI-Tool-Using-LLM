import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

model_name = 'models/gemini-2.5-flash-preview-tts'

try:
    print("Attempt 3: raw dict with response_modalities")
    model = genai.GenerativeModel(model_name)
    # Passing a dict might bypass strict validation if the SDK allows it
    # or it might fail if it converts to the dataclass.
    # Let's try.
    response = model.generate_content(
        "Hello, this is a test.",
        generation_config={"response_modalities": ["AUDIO"], "speech_config": {"voice_config": {"prebuilt_voice_config": {"voice_name": "Aoede"}}}}
    )
    print("Success!")
    print("Response parts:", len(response.parts))
    part = response.parts[0]
    # print(dir(part))
    if hasattr(part, 'inline_data'):
        print("Has inline_data")
        print("Mime:", part.inline_data.mime_type)
        print("Data len:", len(part.inline_data.data))
    else:
        print("No inline_data")
        print(part)
    
except Exception as e:
    print("Error 3:", e)
