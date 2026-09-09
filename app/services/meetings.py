from sqlalchemy import text
from sqlalchemy.orm import Session


def get_today_meetings(db: Session, user_id: str):
    query = text("""
        SELECT
            id,
            title,
            description,
            start_at,
            end_at,
            location,
            project_id,
            created_at,
            updated_at,
            deleted_at
        FROM meetings
        WHERE user_id = :user_id
          AND deleted_at IS NULL
          AND start_at >= CURRENT_DATE
          AND start_at < CURRENT_DATE + INTERVAL '1 day'
        ORDER BY start_at ASC
    """)

    result = db.execute(
        query,
        {"user_id": user_id}
    )

    return [
        dict(row._mapping)
        for row in result
    ]

def get_next_meeting(db: Session, user_id: str):
    query = text("""
        SELECT
            id,
            title,
            description,
            start_at,
            end_at,
            location,
            project_id,
            created_at,
            updated_at,
            deleted_at
        FROM meetings
        WHERE user_id = :user_id
          AND deleted_at IS NULL
          AND start_at > NOW()
        ORDER BY start_at ASC
        LIMIT 1
    """)

    result = db.execute(
        query,
        {"user_id": user_id}
    )

    row = result.fetchone()

    if row is None:
        return None

    return dict(row._mapping)


def get_meetings(
    db: Session,
    user_id: str,
):
    query = text("""
        SELECT
            id,
            user_id,
            title,
            description,
            start_at,
            end_at,
            location,
            project_id,
            created_at,
            updated_at
        FROM meetings
        WHERE user_id = :user_id
            AND deleted_at IS NULL
        ORDER BY start_at ASC
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
        }
    )

    return [
        dict(row._mapping)
        for row in result
    ]


def create_meeting(
    db: Session,
    user_id: str,
    title: str,
    description: str | None = None,
    start_at=None,
    end_at=None,
    location: str | None = None,
    project_id: str | None = None,
):
    if start_at == "":
        start_at = None

    if end_at == "":
        end_at = None

    query = text("""
        INSERT INTO meetings (
            user_id,
            title,
            description,
            start_at,
            end_at,
            location,
            project_id
        )
        VALUES (
            :user_id,
            :title,
            :description,
            :start_at,
            :end_at,
            :location,
            :project_id
        )
        RETURNING
            id,
            user_id,
            title,
            description,
            start_at,
            end_at,
            location,
            project_id,
            created_at,
            updated_at
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
            "title": title,
            "description": description,
            "start_at": start_at,
            "end_at": end_at,
            "location": location,
            "project_id": project_id,
        }
    )

    row = result.fetchone()
    db.commit()

    return dict(row._mapping)

def update_meeting(
    db: Session,
    user_id: str,
    meeting_id: str,
    title: str | None = None,
    description: str | None = None,
    start_at=None,
    end_at=None,
    location: str | None = None,
):
    if start_at == "":
        start_at = None

    if end_at == "":
        end_at = None

    query = text("""
        UPDATE meetings
        SET
            title = COALESCE(:title, title),
            description = COALESCE(:description, description),
            start_at = COALESCE(:start_at, start_at),
            end_at = COALESCE(:end_at, end_at),
            location = COALESCE(:location, location),
            updated_at = NOW()
        WHERE id = :meeting_id
          AND user_id = :user_id
        RETURNING
            id,
            user_id,
            title,
            description,
            start_at,
            end_at,
            location,
            project_id,
            created_at,
            updated_at
    """)

    result = db.execute(
        query,
        {
            "meeting_id": meeting_id,
            "user_id": user_id,
            "title": title,
            "description": description,
            "start_at": start_at,
            "end_at": end_at,
            "location": location,
        }
    )

    row = result.fetchone()

    if row is None:
        db.rollback()
        return None

    db.commit()

    return dict(row._mapping)


def delete_meeting(
    db: Session,
    user_id: str,
    meeting_id: str,
):
    query = text("""
        UPDATE meetings
        SET
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE id = :meeting_id
          AND user_id = :user_id
          AND deleted_at IS NULL
        RETURNING
            id,
            user_id,
            title,
            description,
            start_at,
            end_at,
            location,
            project_id,
            created_at,
            updated_at,
            deleted_at
    """)

    result = db.execute(
        query,
        {
            "meeting_id": meeting_id,
            "user_id": user_id,
        }
    )

    row = result.fetchone()

    if row is None:
        db.rollback()
        return None

    db.commit()

    return dict(row._mapping)

def get_deleted_meetings(
    db: Session,
    user_id: str,
):
    query = text("""
        SELECT
            id,
            user_id,
            title,
            description,
            start_at,
            end_at,
            location,
            project_id,
            created_at,
            updated_at,
            deleted_at
        FROM meetings
        WHERE user_id = :user_id
          AND deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
        }
    )

    return [
        dict(row._mapping)
        for row in result
    ]
