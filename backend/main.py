import os
import base64
import tempfile
import asyncio
import time
import wave
import json
import shutil
from datetime import datetime
from typing import Optional, Dict, List

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# History Directory Setup
HISTORY_DIR = os.path.join(os.path.dirname(__file__), 'history')
if not os.path.exists(HISTORY_DIR):
    os.makedirs(HISTORY_DIR)

app.mount("/history", StaticFiles(directory=HISTORY_DIR), name="history")

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("Warning: GOOGLE_API_KEY not found in environment variables")

genai.configure(api_key=GOOGLE_API_KEY)

# Models
STORY_MODEL_NAME = 'gemini-2.5-flash'
TTS_MODEL_NAME = 'models/gemini-2.5-flash-preview-tts'

# Rate Limiting
RATE_LIMIT_SECONDS = 15
last_requests: Dict[str, float] = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path == "/api/generate" and request.method == "POST":
        client_ip = request.client.host
        current_time = time.time()
        
        if client_ip in last_requests:
            elapsed = current_time - last_requests[client_ip]
            if elapsed < RATE_LIMIT_SECONDS:
                return JSONResponse(
                    status_code=429,
                    content={"detail": f"Rate limit exceeded. Please wait {int(RATE_LIMIT_SECONDS - elapsed)} seconds."}
                )
        
        last_requests[client_ip] = current_time
        
    response = await call_next(request)
    return response

@app.get("/")
async def root():
    return {"message": "Image-to-Speech GenAI API is running"}

@app.post("/api/generate")
async def generate_story_and_audio(
    files: List[UploadFile] = File(...),
    style: str = Form("Creative"),
    voice: str = Form("Aoede"),
    language: str = Form("English"),
    custom_prompt: Optional[str] = Form(None)
):
    print(f"Received request with {len(files)} files. Style: {style}, Voice: {voice}, Language: {language}")
    try:
        # 1. Read Images
        print("Reading images...")
        image_parts = []
        for file in files:
            content = await file.read()
            image_parts.append({
                "mime_type": file.content_type or "image/jpeg",
                "data": content
            })
        print(f"Read {len(image_parts)} images.")
        
        # 2. Generate Story using Gemini 2.5 Flash
        print("Generating story...")
        model = genai.GenerativeModel(STORY_MODEL_NAME)
        
        base_prompt = f"""
        Look at these images and create a creative, engaging short story that connects them together.
        
        STORY STYLE: {style}
        STORY LANGUAGE: {language}
        """
        
        if custom_prompt:
            base_prompt += f"\nADDITIONAL INSTRUCTIONS: {custom_prompt}\n"
            
        base_prompt += f"""
        The story should be descriptive but concise (around 100-150 words). 
        Write it in {language}.
        Write it in a style that is perfect for an interesting storytelling voice.
        Make it sound natural, captivating, and vivid.
        """
        
        # Combine prompt and all images
        request_content = [base_prompt] + image_parts
        
        response = await model.generate_content_async(request_content)
        story_text = response.text
        print("Story generated successfully.")
        print(f"Story preview: {story_text[:50]}...")
        
        # 3. Generate Audio using Gemini 2.5 Flash TTS
        print("Generating audio...")
        tts_model = genai.GenerativeModel(TTS_MODEL_NAME)
        
        tts_response = await tts_model.generate_content_async(
            story_text,
            generation_config={
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": voice
                        }
                    }
                }
            }
        )
        print("Audio generated successfully.")
        
        audio_part = tts_response.parts[0]
        pcm_data = audio_part.inline_data.data
        
        # Create a temporary WAV file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            tmp_path = tmp_file.name
            
        with wave.open(tmp_path, 'wb') as wav_file:
            wav_file.setnchannels(1) 
            wav_file.setsampwidth(2) 
            wav_file.setframerate(24000) 
            wav_file.writeframes(pcm_data)
            
        with open(tmp_path, "rb") as audio_file:
            audio_bytes = audio_file.read()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
        os.unlink(tmp_path)
        
        # Save to history
        timestamp = int(time.time() * 1000)
        filename_base = f"{timestamp}"
        audio_filename = f"{filename_base}.wav"
        audio_path = os.path.join(HISTORY_DIR, audio_filename)

        # Write wav file
        with open(audio_path, "wb") as f:
            f.write(audio_bytes)

        # Create metadata
        metadata = {
            "id": timestamp,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "story": story_text,
            "audio_url": f"http://127.0.0.1:8000/history/{audio_filename}",
            "style": style,
            "voice": voice,
            "language": language,
            "preview": story_text[:100] + "..."
        }

        metadata_filename = f"{filename_base}.json"
        with open(os.path.join(HISTORY_DIR, metadata_filename), "w", encoding='utf-8') as f:
            json.dump(metadata, f)
        
        return JSONResponse(content={
            "story": story_text,
            "audio": f"data:audio/wav;base64,{audio_base64}",
            "history_item": metadata
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history():
    history_items = []
    if not os.path.exists(HISTORY_DIR):
        return []
    
    files = os.listdir(HISTORY_DIR)
    # Filter for json files
    json_files = [f for f in files if f.endswith(".json")]
    
    for json_file in json_files:
        try:
            with open(os.path.join(HISTORY_DIR, json_file), "r", encoding='utf-8') as f:
                item = json.load(f)
                history_items.append(item)
        except:
            continue
            
    # Sort by id (timestamp) descending
    history_items.sort(key=lambda x: x["id"], reverse=True)
    return history_items

@app.delete("/api/history/{id}")
async def delete_history(id: int):
    filename_base = str(id)
    json_path = os.path.join(HISTORY_DIR, f"{filename_base}.json")
    audio_path = os.path.join(HISTORY_DIR, f"{filename_base}.wav")
    
    if os.path.exists(json_path):
        os.remove(json_path)
    if os.path.exists(audio_path):
        os.remove(audio_path)
        
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
