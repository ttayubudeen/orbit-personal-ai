from sqlalchemy import text
from sqlalchemy.orm import Session


def ensure_conversation_schema(db: Session):
    """
    Apply conversation schema updates that are required by the app.

    Safe to run on every application startup.
    """

    db.execute(
        text("""
            ALTER TABLE conversations
            ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE
        """)
    )

    db.commit()


def create_conversation(
    db: Session,
    user_id: str,
    title: str | None = None,
):
    query = text("""
        INSERT INTO conversations (
            user_id,
            title
        )
        VALUES (
            :user_id,
            :title
        )
        RETURNING
            id,
            user_id,
            title,
            pinned,
            created_at,
            updated_at
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
            "title": title,
        },
    )

    row = result.fetchone()
    db.commit()

    return dict(row._mapping)


def add_message(
    db: Session,
    conversation_id: str,
    user_id: str,
    role: str,
    content: str,
):
    query = text("""
        INSERT INTO messages (
            conversation_id,
            role,
            content
        )
        SELECT
            :conversation_id,
            :role,
            :content
        FROM conversations
        WHERE id = :conversation_id
        AND user_id = :user_id
        RETURNING
            id,
            conversation_id,
            role,
            content,
            created_at
    """)

    result = db.execute(
        query,
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,
            "content": content,
        },
    )

    row = result.fetchone()

    if row is None:
        db.rollback()
        return None

    db.execute(
        text("""
            UPDATE conversations
            SET updated_at = NOW()
            WHERE id = :conversation_id
            AND user_id = :user_id
        """),
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
        },
    )

    if role == "user":
        title = " ".join(content.strip().split())

        if len(title) > 50:
            title = title[:50].rstrip(" ,.!?") + "..."

        db.execute(
            text("""
                UPDATE conversations
                SET
                    title = COALESCE(NULLIF(title, ''), :title),
                    updated_at = NOW()
                WHERE id = :conversation_id
                AND user_id = :user_id
            """),
            {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "title": title,
            },
        )

    db.commit()

    return dict(row._mapping)


def get_conversation_messages(
    db: Session,
    conversation_id: str,
    user_id: str,
):
    query = text("""
        SELECT
            messages.id,
            messages.conversation_id,
            messages.role,
            messages.content,
            messages.created_at
        FROM messages
        JOIN conversations
            ON conversations.id = messages.conversation_id
        WHERE messages.conversation_id = :conversation_id
        AND conversations.user_id = :user_id
        ORDER BY messages.created_at ASC
    """)

    result = db.execute(
        query,
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
        },
    )

    return [
        dict(row._mapping)
        for row in result
    ]


def get_recent_messages(
    db: Session,
    conversation_id: str,
    user_id: str,
    limit: int = 12,
):
    query = text("""
        SELECT
            messages.id,
            messages.conversation_id,
            messages.role,
            messages.content,
            messages.created_at
        FROM messages
        JOIN conversations
            ON conversations.id = messages.conversation_id
        WHERE messages.conversation_id = :conversation_id
        AND conversations.user_id = :user_id
        ORDER BY messages.created_at DESC
        LIMIT :limit
    """)

    result = db.execute(
        query,
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "limit": limit,
        },
    )

    messages = [
        dict(row._mapping)
        for row in result
    ]

    messages.reverse()

    return messages


def get_conversation_for_user(
    db: Session,
    conversation_id: str,
    user_id: str,
):
    query = text("""
        SELECT
            id,
            user_id,
            title,
            pinned,
            created_at,
            updated_at
        FROM conversations
        WHERE id = :conversation_id
        AND user_id = :user_id
    """)

    result = db.execute(
        query,
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
        },
    )

    row = result.fetchone()

    if row is None:
        return None

    return dict(row._mapping)


def get_conversations_for_user(
    db: Session,
    user_id: str,
):
    query = text("""
        SELECT
            id,
            user_id,
            title,
            pinned,
            created_at,
            updated_at
        FROM conversations
        WHERE user_id = :user_id
        ORDER BY
            pinned DESC,
            updated_at DESC
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
        },
    )

    return [
        dict(row._mapping)
        for row in result
    ]


def toggle_conversation_pin(
    db: Session,
    conversation_id: str,
    user_id: str,
):
    query = text("""
        UPDATE conversations
        SET pinned = NOT pinned
        WHERE id = :conversation_id
        AND user_id = :user_id
        RETURNING
            id,
            user_id,
            title,
            pinned,
            created_at,
            updated_at
    """)

    result = db.execute(
        query,
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
        },
    )

    row = result.fetchone()

    if row is None:
        db.rollback()
        return None

    db.commit()

    return dict(row._mapping)


def rename_conversation(
    db: Session,
    conversation_id: str,
    user_id: str,
    title: str,
):
    query = text("""
        UPDATE conversations
        SET
            title = :title,
            updated_at = NOW()
        WHERE id = :conversation_id
        AND user_id = :user_id
        RETURNING
            id,
            user_id,
            title,
            pinned,
            created_at,
            updated_at
    """)

    result = db.execute(
        query,
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "title": title,
        },
    )

    row = result.fetchone()

    if row is None:
        db.rollback()
        return None

    db.commit()

    return dict(row._mapping)


def delete_conversation(
    db: Session,
    conversation_id: str,
    user_id: str,
):
    conversation_check = db.execute(
        text("""
            SELECT id
            FROM conversations
            WHERE id = :conversation_id
            AND user_id = :user_id
        """),
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
        },
    ).fetchone()

    if conversation_check is None:
        db.rollback()
        return False

    db.execute(
        text("""
            DELETE FROM messages
            WHERE conversation_id = :conversation_id
        """),
        {
            "conversation_id": conversation_id,
        },
    )

    db.execute(
        text("""
            DELETE FROM conversations
            WHERE id = :conversation_id
            AND user_id = :user_id
        """),
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
        },
    )

    db.commit()

    return True