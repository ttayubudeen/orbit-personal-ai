
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.services.tasks import (
    get_active_tasks,
    get_task,
    create_task,
    update_task,
    complete_task,
)


from app.services.meetings import (
    get_today_meetings,
    get_next_meeting,
)
from app.services.conversations import (
    create_conversation,
    get_conversations_for_user,
    get_conversation_messages,
    get_conversation_for_user,
)

from app.services.assistant import prepare_assistant_context

from app.services.memories import (
    create_memory,
    search_memories,
)

from app.schemas.chat import ChatRequest
from app.auth.routes import router as auth_router
from app.auth.dependencies import get_current_user
from app.services.llm_usage import (
    get_usage_summary,
    get_usage_by_model,
    get_usage_by_user,
)
from app.core.rate_limit import check_ai_rate_limit
from pwdlib import PasswordHash
from fastapi.middleware.cors import CORSMiddleware
from app.services.llm_usage import ensure_llm_usage_table
import os


ADMIN_USER_ID = os.getenv("ADMIN_USER_ID")

app = FastAPI()


@app.on_event("startup")
def startup():
    from app.database import SessionLocal

    db = SessionLocal()

    try:
        ensure_llm_usage_table(db)
    finally:
        db.close()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

class AssistantRequest(BaseModel):
    message: str


@app.get("/")
def root():
    return {"message": "Personal Assistant API is running"}


class CreateConversationRequest(BaseModel):
    title: str | None = None


@app.get("/admin/usage")
def admin_usage(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(current_user["id"])

    if not ADMIN_USER_ID or user_id != ADMIN_USER_ID:
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    summary = get_usage_summary(db)
    by_model = get_usage_by_model(db)
    by_user = get_usage_by_user(db)

    return {
        "period": "current_month",
        "summary": summary,
        "by_model": by_model,
        "by_user": by_user,
    }


@app.post("/conversations")
def create_new_conversation(
    request: CreateConversationRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(current_user["id"])

    title = request.title.strip() if request.title else None

    if title == "":
        title = None

    conversation = create_conversation(
        db=db,
        user_id=user_id,
        title=title,
    )

    return conversation


@app.get("/conversations")
def list_conversations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(current_user["id"])

    conversations = get_conversations_for_user(
        db=db,
        user_id=user_id,
    )

    return {
        "conversations": conversations,
    }


@app.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(current_user["id"])

    conversation = get_conversation_for_user(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    messages = get_conversation_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
    )

    return {
        "conversation": conversation,
        "messages": messages,
    }


@app.post("/chat/{conversation_id}")
def chat(
    conversation_id: str,
    request: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = str(current_user["id"])

    check_ai_rate_limit(user_id)

    conversation = get_conversation_for_user(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    result = prepare_assistant_context(
        db=db,
        user_id=user_id,
        conversation_id=conversation_id,
        user_message=request.message,
    )

    return result