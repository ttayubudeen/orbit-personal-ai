from sqlalchemy import text
from sqlalchemy.orm import Session


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS llm_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_created_at
    ON llm_usage (created_at);

CREATE INDEX IF NOT EXISTS idx_llm_usage_user_id_created_at
    ON llm_usage (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_llm_usage_provider_model
    ON llm_usage (provider, model);
"""


def ensure_llm_usage_table(db: Session):
    db.execute(text(CREATE_TABLE_SQL))
    db.commit()


def record_llm_usage(
    db: Session,
    user_id: str,
    provider: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    total_tokens: int = 0,
    success: bool = True,
):
    query = text(
        """
        INSERT INTO llm_usage (
            user_id,
            provider,
            model,
            input_tokens,
            output_tokens,
            total_tokens,
            success
        )
        VALUES (
            :user_id,
            :provider,
            :model,
            :input_tokens,
            :output_tokens,
            :total_tokens,
            :success
        )
        """
    )

    db.execute(
        query,
        {
            "user_id": user_id,
            "provider": provider,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "success": success,
        },
    )

    db.commit()


def get_usage_summary(
    db: Session,
    user_id: str | None = None,
):
    user_filter = ""
    params = {}

    if user_id is not None:
        user_filter = "AND user_id = :user_id"
        params["user_id"] = user_id

    query = text(
        f"""
        SELECT
            COUNT(*) AS ai_requests,
            COALESCE(SUM(input_tokens), 0) AS input_tokens,
            COALESCE(SUM(output_tokens), 0) AS output_tokens,
            COALESCE(SUM(total_tokens), 0) AS total_tokens,
            COUNT(DISTINCT user_id) AS users
        FROM llm_usage
        WHERE created_at >= date_trunc('month', NOW())
        {user_filter}
        """
    )

    row = db.execute(query, params).fetchone()

    return {
        "ai_requests": int(row.ai_requests),
        "input_tokens": int(row.input_tokens),
        "output_tokens": int(row.output_tokens),
        "total_tokens": int(row.total_tokens),
        "users": int(row.users),
    }


def get_usage_by_model(
    db: Session,
    user_id: str | None = None,
):
    user_filter = ""
    params = {}

    if user_id is not None:
        user_filter = "AND user_id = :user_id"
        params["user_id"] = user_id

    query = text(
        f"""
        SELECT
            provider,
            model,
            COUNT(*) AS requests,
            COALESCE(SUM(input_tokens), 0) AS input_tokens,
            COALESCE(SUM(output_tokens), 0) AS output_tokens,
            COALESCE(SUM(total_tokens), 0) AS total_tokens
        FROM llm_usage
        WHERE created_at >= date_trunc('month', NOW())
        {user_filter}
        GROUP BY provider, model
        ORDER BY total_tokens DESC
        """
    )

    rows = db.execute(query, params).fetchall()

    return [
        {
            "provider": row.provider,
            "model": row.model,
            "requests": int(row.requests),
            "input_tokens": int(row.input_tokens),
            "output_tokens": int(row.output_tokens),
            "total_tokens": int(row.total_tokens),
        }
        for row in rows
    ]


def get_usage_by_user(db: Session):
    query = text(
        """
        SELECT
            u.id AS user_id,
            u.name,
            u.email,
            COUNT(l.id) AS requests,
            COALESCE(SUM(l.input_tokens), 0) AS input_tokens,
            COALESCE(SUM(l.output_tokens), 0) AS output_tokens,
            COALESCE(SUM(l.total_tokens), 0) AS total_tokens
        FROM users u
        LEFT JOIN llm_usage l
            ON l.user_id = u.id
            AND l.created_at >= date_trunc('month', NOW())
        GROUP BY u.id, u.name, u.email
        ORDER BY total_tokens DESC
        """
    )

    rows = db.execute(query).fetchall()

    return [
        {
            "user_id": str(row.user_id),
            "name": row.name,
            "email": row.email,
            "requests": int(row.requests),
            "input_tokens": int(row.input_tokens),
            "output_tokens": int(row.output_tokens),
            "total_tokens": int(row.total_tokens),
        }
        for row in rows
    ]