from sqlalchemy import text
from sqlalchemy.orm import Session


def create_memory(
    db: Session,
    user_id: str,
    content: str,
    category: str | None = None,
    importance: int = 3,
):
    query = text("""
        INSERT INTO memories (
            user_id,
            content,
            category,
            importance
        )
        VALUES (
            :user_id,
            :content,
            :category,
            :importance
        )
        RETURNING
            id,
            user_id,
            content,
            category,
            importance,
            created_at,
            updated_at
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
            "content": content,
            "category": category,
            "importance": importance,
        }
    )

    row = result.fetchone()
    db.commit()

    return dict(row._mapping)


def search_memories(
    db: Session,
    user_id: str,
    query_text: str,
    limit: int = 5,
):
    query = text("""
        SELECT
            id,
            user_id,
            content,
            category,
            importance,
            created_at,
            updated_at
        FROM memories
        WHERE user_id = :user_id
          AND (
              content ILIKE '%' || :query_text || '%'
              OR category ILIKE '%' || :query_text || '%'
              OR (
                  :query_text ILIKE '%career%'
                  AND (
                      category IN ('career', 'preference', 'goal')
                      OR content ILIKE '%job%'
                      OR content ILIKE '%work%'
                      OR content ILIKE '%development%'
                  )
              )
          )
        ORDER BY
            importance DESC,
            updated_at DESC
        LIMIT :limit
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
            "query_text": query_text,
            "limit": limit,
        }
    )

    return [
        dict(row._mapping)
        for row in result
    ]



def get_memory(
    db: Session,
    user_id: str,
    memory_id: str,
):
    query = text("""
        SELECT
            id,
            user_id,
            content,
            category,
            importance,
            created_at,
            updated_at
        FROM memories
        WHERE id = :memory_id
          AND user_id = :user_id
    """)

    result = db.execute(
        query,
        {
            "memory_id": memory_id,
            "user_id": user_id,
        }
    )

    row = result.fetchone()

    if row is None:
        return None

    return dict(row._mapping)
