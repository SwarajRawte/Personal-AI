# 🌌 PersonalAI: Your Intelligence Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

PersonalAI is a state-of-the-art, multi-modal intelligence hub designed to streamline your digital life. It combines high-performance LLMs, vector-based long-term memory, and real-time internet research into a premium, glassmorphic dashboard.

---

## ✨ Specialized Intelligence Features

### 🧠 Unified Long-Term Memory (RAG)
PersonalAI doesn't just "chat"—it remembers. Using **ChromaDB**, every conversation is indexed and retrieved in real-time, providing deep context-awareness for your ongoing projects and personal notes.

### 🖼️ Multi-Modal Vision
Integrated with **Google Gemini 1.5 Flash**, the dashboard supports seamless image analysis. 
- **GPT-Style Paste**: Simply press `Ctrl+V` to paste screenshots or photos.
- **Smart Analysis**: The AI "sees" your data and can provide visual search, text extraction, and reasoning directly from your images.

### 🌐 Real-time Web Research
The AI is always connected. It intelligently detects when your question requires live internet data and uses **DuckDuckGo Search** to provide citations, current news, and up-to-the-minute statistics.

### 📂 Document Knowledge Base
Build your own local brain. Upload **PDF, CSV, and TXT** documents via the premium Knowledge Base interface to query your private documents with 100% data control.

---

## 🎨 Premium UI/UX Design
- **Glassmorphism Appearance**: A sleek, translucent UI with vibrant gradients and neon accents.
- **Micro-Animations**: Smooth transitions, sliding previews, and intelligent focus handling for a fluid experience.
- **Responsive Dock**: A smart input container that adapts to Vision, Voice, and Text inputs simultaneously.
- **Universal Themes**: High-contrast dark mode optimized for late-night focus sessions.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Lucide Icons, Vanilla CSS (Premium Tokens)
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic v2
- **AI Engine**: 
  - **Gemini Pro 1.5** (Vision & Core Reasoning)
  - **Llama3 / Mixtral** (High-speed Chat via Groq)
  - **Dall-E / Stable Diffusion** (Image Generation)
- **Database**: 
  - SQLite (Structured User Data)
  - **ChromaDB** (Unstructured Vector Memory)

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.9+ 
- Node.js 18+
- API Keys: `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HUGGINGFACE_API_KEY` (Add to `backend/.env`)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 🗺️ Roadmap
- [x] RAG-based Long-term Memory
- [x] Multi-modal Vision Support
- [x] Real-time Web Search Integration
- [ ] Mobile App (React Native)
- [ ] Local LLM Execution (Ollama Integration)
- [ ] Collaborative Team Workspaces

---

## 🙌 Contribute
Feel free to open issues or submit PRs to enhance the PersonalAI ecosystem. Let's build the future of personal intelligence together!

---
Developed with ❤️ by [Swaraj Rawte](https://github.com/SwarajRawte)
