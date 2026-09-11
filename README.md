# ORBIT — Personal AI Assistant

ORBIT is a full-stack personal AI assistant built to combine conversational AI with persistent personal data.

It provides a ChatGPT-style conversational interface while allowing the assistant to work with user-specific conversations, memories, tasks, and meetings through an application-controlled tool system.

The project is built with **FastAPI, PostgreSQL, React, TypeScript, and multiple AI providers**, with automatic provider fallback for improved reliability.

---

## ✨ Features

### 🤖 AI Assistant

- Natural conversational interface
- Persistent conversation history
- Multi-provider AI architecture
- Automatic AI provider fallback
- Provider health tracking and temporary cooldowns
- Application-controlled tool execution
- Recent conversation context
- Support for multiple AI providers including Gemini, Groq, and OpenAI

### 🧠 Persistent Memory

- Store important user information
- Search previously stored memories
- User-specific memory isolation
- AI can retrieve relevant memories when needed
- Explicit memory creation through the assistant's tool system

### ✅ Task Management

- Create tasks through the assistant
- View active tasks
- Update tasks
- Complete tasks
- User-specific task data

### 📅 Meeting Management

- Store meeting information
- View today's meetings
- Find the next upcoming meeting
- User-specific meeting data

### 💬 Conversation Management

- Create conversations
- Persistent conversation history
- Pin conversations
- Rename conversations
- Delete conversations
- Pinned conversations appear first
- Server-side conversation ownership checks

### 🔐 Authentication & Security

- User registration and login
- JWT-based authentication
- Argon2 password hashing through `pwdlib`
- Expiring access tokens
- Protected API routes
- User ownership enforcement
- AI request rate limiting
- Environment-based secrets and API keys
- Configured CORS origins
- Admin-only usage analytics

### 📊 Admin Usage Dashboard

Administrators can view:

- Total AI requests
- Input token usage
- Output token usage
- Total token usage
- Usage by AI model
- Usage by provider
- Usage by user

### 📱 Responsive Interface

ORBIT is designed for both desktop and mobile use.

The interface includes:

- Responsive sidebar
- Collapsible desktop sidebar
- Mobile navigation
- Conversation management controls
- Dark minimal UI
- Mobile-friendly touch targets
- Admin usage interface

---

## 🏗️ Architecture

ORBIT follows a layered architecture where the AI model does not directly access the database.

```text
┌─────────────────────────────┐
│        React Frontend       │
│     TypeScript + Vite       │
└──────────────┬──────────────┘
               │
               │ HTTP + JWT
               ▼
┌─────────────────────────────┐
│        FastAPI Backend      │
└──────────────┬──────────────┘
               │
       ┌───────┼────────┐
       │       │        │
       ▼       ▼        ▼
    Auth   Services   AI Layer
       │       │        │
       │       │        ▼
       │       │    AI Providers
       │       │        │
       │       │        ▼
       │       │   Tool Executor
       │       │        │
       └───────┼────────┘
               ▼
        ┌──────────────┐
        │  PostgreSQL  │
        └──────────────┘
```

**The AI interaction flow is:**

```text
User
  ↓
Frontend
  ↓
FastAPI
  ↓
Assistant
  ↓
LLM
  ↓
Tool Call
  ↓
Application Tool Executor
  ↓
PostgreSQL
  ↓
Tool Result
  ↓
LLM
  ↓
Assistant Response
  ↓
Frontend
```

The LLM does not receive unrestricted database access. Database operations are performed by application code, allowing authentication and ownership rules to remain under backend control.

---

## 🧠 AI Provider System

ORBIT uses a prioritized AI provider system with automatic fallback.

The current model priority is:

1. Gemini 3.7 Flash
2. Gemini 3.6 Flash
3. Gemini 3.5 Flash
4. GPT-OSS 120B through Groq
5. Gemini 3.1 Flash-Lite
6. GPT-OSS 20B through Groq
7. Gemini 3.5 Flash-Lite
8. Gemini 2.5 Flash
9. Gemini 2.5 Flash-Lite
10. GPT-5.6 Luna through OpenAI

When a provider experiences a supported temporary failure such as a timeout, rate limit, overload, or service-unavailable response, ORBIT can temporarily place that provider into cooldown.

The router then continues with the next available provider.

Once the cooldown expires, the provider becomes available again.

This allows the assistant to continue operating even when an individual AI provider is temporarily unavailable.

---

## 🛠️ Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

**Backend**
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT
- pwdlib
- Argon2

**Database**
- PostgreSQL

**AI Providers**
- Google Gemini
- Groq
- OpenAI

**Deployment**
- Render
- Render PostgreSQL
- Docker

---

## 📁 Project Structure

```text
orbit-personal-ai/
│
├── app/
│   ├── ai/
│   │   ├── assistant.py
│   │   ├── provider_router.py
│   │   ├── provider_health.py
│   │   ├── tools.py
│   │   └── tool_executor.py
│   │
│   ├── auth/
│   │   ├── dependencies.py
│   │   ├── routes.py
│   │   └── security.py
│   │
│   ├── core/
│   │   └── rate_limit.py
│   │
│   ├── schemas/
│   │   └── chat.py
│   │
│   ├── services/
│   │   ├── assistant.py
│   │   ├── conversations.py
│   │   ├── memories.py
│   │   ├── meetings.py
│   │   └── tasks.py
│   │
│   ├── database.py
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── Dockerfile
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

- Python 3.12+
- Node.js
- npm
- PostgreSQL
- Git

You will also need API keys for the AI providers you want to enable.

### 📥 Clone the Repository

```bash
git clone https://github.com/ttayubudeen/orbit-personal-ai.git
cd orbit-personal-ai
```

### 🔧 Backend Setup

Create a Python virtual environment.

**Windows**
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

### 🔑 Environment Variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/orbit

JWT_SECRET_KEY=your-long-random-secret

GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

FRONTEND_URL=http://localhost:5173

RATE_LIMIT_REQUESTS=20
RATE_LIMIT_WINDOW_SECONDS=60

RATE_LIMIT_EXEMPT_USER_ID=your-user-id
```

Do not commit the real `.env` file to GitHub.

Use `.env.example` as the reference for the required environment variables.

### ▶️ Start the Backend

From the project root:

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

```
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is available at:

```
http://127.0.0.1:8000/docs
```

### 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```
frontend/.env
```

with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

The frontend will normally be available at:

```
http://localhost:5173
```

---

## 🗄️ Database

ORBIT uses PostgreSQL for persistent application data.

The main data areas include:

- users
- conversations
- messages
- tasks
- meetings
- memories
- llm_usage

Conversations contain a `pinned` field that controls conversation pinning and sorting.

The backend performs the required conversation schema check during startup. This allows the required `pinned` column to be created automatically when deploying the updated application to a database that does not yet contain it.

---

## 🔐 Security

ORBIT uses several basic security mechanisms to protect user data and application resources.

### Authentication

Authentication is handled using JWT access tokens.

Tokens are:

- Signed using a server-side secret
- Associated with the authenticated user
- Validated on protected API routes
- Expiring after a configured period

### Password Security

User passwords are never stored as plaintext.

Passwords are hashed using Argon2 through `pwdlib`.

### Authorization

User-owned resources are accessed using the authenticated user's ID.

For conversation operations, the backend verifies both:

- conversation ID
- authenticated user ID

This prevents a user from modifying another user's conversation simply by knowing its ID.

### Rate Limiting

AI requests are rate-limited per user to reduce excessive or abusive API usage.

### Secrets

Database credentials, JWT secrets, and AI provider API keys are provided through environment variables.

Secrets should never be committed to the repository.

---

## 📊 Usage Tracking

ORBIT records AI usage information to support administrative monitoring.

Tracked information includes:

- AI requests
- Input tokens
- Output tokens
- Total tokens
- Provider
- Model
- User

Administrators can access this information through the admin usage interface.

---

## ☁️ Deployment

ORBIT is designed to be deployed using Render.

A typical deployment consists of:

```text
                 GitHub
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   Render Backend       Render Frontend
          │
          ▼
   Render PostgreSQL
```

### Backend

The backend is deployed using Docker.

The container runs the FastAPI application using the port provided by Render.

### Frontend

The frontend is built using:

```bash
npm ci
npm run build
```

The generated production files are located in:

```
frontend/dist
```

### Database

The production backend connects to Render PostgreSQL using:

```
DATABASE_URL
```

The backend startup schema check ensures the required conversation schema is present after deployment.

---

## 🧪 Local Verification

Before pushing changes to GitHub, run the following checks.

### Backend

From the project root:

```bash
python -m compileall app
```

### Frontend

```bash
cd frontend
npm run build
```

### Git Status

From the project root:

```bash
git status
```

Make sure that:

- `.env` is not being committed
- `frontend/.env` is not being committed
- `.venv` is not being committed
- `node_modules` is not being committed
- `frontend/dist` is not being committed

---

## 🗺️ V1 Scope

ORBIT V1 focuses on the core personal assistant experience.

The current release includes:

- Conversational AI
- Persistent conversations
- Memory
- Tasks
- Meetings
- Authentication
- Conversation management
- AI provider fallback
- AI usage tracking
- Admin analytics
- Responsive web interface

The project intentionally keeps the V1 architecture relatively simple so that the core assistant remains understandable, maintainable, and easy to extend.

---

## 🔮 Future Improvements

Potential future improvements include:

- HttpOnly cookie-based authentication
- More advanced session management
- Distributed rate limiting
- Formal database migration tooling
- Additional integrations
- Advanced memory management
- Streaming AI responses
- File and document understanding
- Improved observability
- Automated testing
- CI/CD pipelines

These improvements are outside the current V1 scope.

---

## 👨‍💻 Author

**Ttayubudeen**

GitHub: [https://github.com/ttayubudeen/orbit-personal-ai](https://github.com/ttayubudeen/orbit-personal-ai)

---

## 📄 License

This project is currently provided as a personal software project.

An explicit open-source license can be added if the project is later intended for public reuse, modification, or distribution.