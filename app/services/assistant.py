from sqlalchemy.orm import Session

from app.services.conversations import (
    add_message,
    get_recent_messages,
)

from app.ai.assistant import generate_response


def prepare_assistant_context(
    db: Session,
    user_id: str,
    conversation_id: str,
    user_message: str,
):
    # 1. Store the user's message
    add_message(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
        role="user",
        content=user_message,
    )

    # 2. Retrieve recent conversation history
    messages = get_recent_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
        limit=20,
    )

    # 3. Let OpenAI decide which tools it needs
    response = generate_response(
        db=db,
        user_id=user_id,
        conversation_messages=messages,
    )

    # 4. Store the assistant's response
    add_message(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
        role="assistant",
        content=response,
    )

    return {
        "response": response,
    }
