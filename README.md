# ORBIT — Personal AI Assistant

> Think · Plan · Build · Evolve

ORBIT is a personal AI assistant built with FastAPI, React, PostgreSQL, and multiple LLM providers.

It is designed around a simple idea:

**One assistant that can understand conversations, remember useful context, use tools, manage tasks and meetings, and intelligently fall back between AI models when a provider becomes unavailable.**

## Features

- JWT authentication
- Secure password hashing with Argon2
- User-specific data isolation
- Persistent conversations
- Structured long-term memory
- Task management
- Meeting management
- Application-controlled tool/function calling
- Deletion confirmation safety
- Multi-model AI fallback
- Model-specific cooldown and recovery
- Gemini integration
- Groq integration
- OpenAI integration
- Per-user AI rate limiting
- AI token/provider usage tracking
- Admin usage dashboard endpoint
- Dockerized backend and frontend
- React + TypeScript frontend
- PostgreSQL persistence

## Architecture

```text
React + TypeScript
        │
        ▼
     FastAPI
        │
        ├── JWT Authentication
        ├── Conversation Service
        ├── Memory Service
        ├── Task Service
        ├── Meeting Service
        └── AI Assistant
                │
                ▼
        Multi-Model Fallback
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
     Gemini   Groq     OpenAI
                │
                ▼
           Tool Executor
                │
                ▼
           PostgreSQL

The LLM does not directly access the database.

Tool requests are interpreted by the application, executed by the backend, and the resulting data is returned to the model.

AI Model Fallback

ORBIT uses an ordered model fallback strategy.

If a model temporarily fails because of rate limits, quota exhaustion, overload, timeout, or service availability issues, it enters a temporary cooldown and the next available model is used.

The original model priority is automatically restored after recovery.

Current priority:

Gemini 3.7 Flash
Gemini 3.6 Flash
Gemini 3.5 Flash
GPT-OSS 120B via Groq
Gemini 3.1 Flash-Lite
GPT-OSS 20B via Groq
Gemini 3.5 Flash-Lite
Gemini 2.5 Flash
Gemini 2.5 Flash-Lite
OpenAI GPT-5.6 Luna
Tech Stack
Backend
Python
FastAPI
SQLAlchemy
PostgreSQL
JWT
Argon2
Pydantic
Frontend
React
TypeScript
Vite
Tailwind CSS
Lucide React
React Markdown
AI Providers
Google Gemini
Groq
OpenAI
Deployment
Docker
Nginx
Render
Project Structure
personal_assistant/
│
├── app/
│   ├── auth/
│   ├── services/
│   ├── tools/
│   ├── database.py
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
├── .dockerignore
└── README.md
Local Development
Backend

Create and activate a Python virtual environment:

python -m venv .venv

Windows PowerShell:

.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Start the backend:

uvicorn app.main:app --reload

The API will be available at:

http://127.0.0.1:8000
Frontend
cd frontend
npm install
npm run dev

The frontend will normally be available at:

http://127.0.0.1:5173
Environment Variables

Create a .env file for local development.

Required variables include:

DATABASE_URL=

JWT_SECRET_KEY=

OPENAI_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=

AI_RATE_LIMIT_REQUESTS=
AI_RATE_LIMIT_WINDOW_SECONDS=
RATE_LIMIT_EXEMPT_USER_ID=

ADMIN_USER_ID=

Frontend:

VITE_API_BASE_URL=http://127.0.0.1:8000

Never commit .env files or API keys to GitHub.

Use .env.example as the template.

Docker

Build the backend:

docker build -t orbit-backend .

Build the frontend:

docker build --build-arg VITE_API_BASE_URL=http://localhost:8000 -t orbit-frontend ./frontend

Run the backend:

docker run --rm -p 8000:8000 --env-file .env orbit-backend

Run the frontend:

docker run --rm -p 5173:80 orbit-frontend

Then open:

http://localhost:5173
Security

ORBIT includes:

JWT-based authentication
Argon2 password hashing
User-scoped database queries
Protected authenticated endpoints
Admin-only usage reporting
Rate limiting
Environment-based secrets
Application-controlled tool execution
Confirmation requirements for destructive actions

API keys and other secrets are intentionally excluded from version control.

Version

Current release:

v1.0.0

ORBIT V1 is intended to be a stable foundation for future development.

Creator

Built by Tayub

License

This project is currently intended as a personal portfolio project.