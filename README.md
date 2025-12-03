# Image-to-Speech GenAI Tool (New Version)

This project has been upgraded to a full-stack web application using React (Frontend) and FastAPI (Backend), integrating Gemini 1.5 Flash for vision/story generation and Edge TTS for high-quality speech.

## Prerequisites

- Node.js (for the frontend)
- Python 3.10+ (for the backend)
- Google API Key (in `.env` file)

## Setup & Running

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
```

Create a virtual environment (optional but recommended):

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the Backend Server:

```bash
uvicorn main:app --reload
```

The backend will start at `http://localhost:8000`.

### 2. Frontend Setup

Open a **new** terminal and navigate to the `frontend` folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the Frontend Development Server:

```bash
npm run dev
```

The frontend will start (usually at `http://localhost:5173`). Open this URL in your browser.

## Features

- **Gemini 1.5 Flash Integration:** Uses the latest fast multimodal model to understand images and generate stories directly.
- **High-Quality TTS:** Uses Edge TTS for natural-sounding neural voices (better than the previous robotic voice).
- **Modern UI:** Built with React and Tailwind CSS for a professional look.
- **FastAPI Backend:** Robust and scalable backend API.

## Notes

- Ensure your `.env` file in the root directory contains your `GOOGLE_API_KEY`.
- The application uses `gemini-1.5-flash`. If you have access to newer experimental models, you can update `MODEL_NAME` in `backend/main.py`.
