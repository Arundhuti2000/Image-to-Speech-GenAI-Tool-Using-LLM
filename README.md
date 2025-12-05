# StoryGen: Image to Audio Story

Hey! This is a project I built to turn memories into creatival and magical stories. You just drop in some photos, pick a vibe (like "Fairy Tale" or "Sci-Fi"), and it uses AI to write a story and narrate it back to you.

It's built using **React** for the frontend and **FastAPI** for the backend, powered by Google's **Gemini 2.5 Flash** model.

## What it does

- **Visual Storytelling:** Uploads multiple images and weaves them into a single cohesive story.
- **Customizable:** You choose the genre, the narrator's voice, and even the language (English, Spanish, Hindi, etc.).
- **Library:** Automatically saves your generated stories and audio so you can listen to them later.
- **Clean UI:** Designed with a minimal, Apple-inspired aesthetic.

## How to run it

You'll need two terminals open (one for the backend, one for the frontend).

### 1. Backend (Python)

Make sure you have your `GOOGLE_API_KEY` in a `.env` file first!

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open the link it gives you (usually `http://localhost:5173`), and you're good to go!
