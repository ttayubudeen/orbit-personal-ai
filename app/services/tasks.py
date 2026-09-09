from sqlalchemy import text
from sqlalchemy.orm import Session


def get_active_tasks(db: Session, user_id: str):
    query = text("""
        SELECT
            id,
            title,
            description,
            status,
            priority,
            due_at,
            project_id,
            created_at,
            updated_at
        FROM tasks
        WHERE user_id = :user_id
            AND status = 'active'
            AND deleted_at IS NULL
        ORDER BY
            CASE priority
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'low' THEN 3
                ELSE 4
            END,
            due_at ASC NULLS LAST,
            created_at ASC
    """)

    result = db.execute(
        query,
        {"user_id": user_id}
    )

    return [
        dict(row._mapping)
        for row in result
    ]

def get_task(db: Session, user_id: str, task_id: str):
    query = text("""
        SELECT
            id,
            title,
            description,
            status,
            priority,
            due_at,
            created_at,
            completed_at,
            project_id
        FROM tasks
        WHERE id = :task_id
          AND user_id = :user_id
        LIMIT 1
    """)

    result = db.execute(
        query,
        {
            "task_id": task_id,
            "user_id": user_id
        }
    )

    row = result.fetchone()

    if not row:
        return None

    return dict(row._mapping)

def create_task(
    db: Session,
    user_id: str,
    title: str,
    description: str | None = None,
    priority: str = "medium",
    due_at=None,
    project_id: str | None = None,
):
    if due_at == "":
        due_at = None

    query = text("""
        INSERT INTO tasks (
            user_id,
            project_id,
            title,
            description,
            status,
            priority,
            due_at
        )
        VALUES (
            :user_id,
            :project_id,
            :title,
            :description,
            'active',
            :priority,
            :due_at
        )
        RETURNING
            id,
            user_id,
            project_id,
            title,
            description,
            status,
            priority,
            due_at,
            created_at,
            updated_at
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
            "project_id": project_id,
            "title": title,
            "description": description,
            "priority": priority,
            "due_at": due_at,
        }
    )

    row = result.fetchone()
    db.commit()

    return dict(row._mapping)


def update_task(
    db: Session,
    user_id: str,
    task_id: str,
    title: str | None = None,
    description: str | None = None,
    priority: str | None = None,
    due_at=None,
):
    if due_at == "":
        due_at = None
    query = text("""
        UPDATE tasks
        SET
            title = COALESCE(:title, title),
            description = COALESCE(:description, description),
            priority = COALESCE(:priority, priority),
            due_at = COALESCE(:due_at, due_at),
            updated_at = NOW()
        WHERE id = :task_id
          AND user_id = :user_id
        RETURNING
            id,
            user_id,
            project_id,
            title,
            description,
            status,
            priority,
            due_at,
            created_at,
            updated_at,
            completed_at
    """)

    result = db.execute(
        query,
        {
            "task_id": task_id,
            "user_id": user_id,
            "title": title,
            "description": description,
            "priority": priority,
            "due_at": due_at,
        }
    )

    row = result.fetchone()

    if row is None:
        db.rollback()
        return None

    db.commit()

    return dict(row._mapping)


def complete_task(
    db: Session,
    user_id: str,
    task_id: str,
):
    query = text("""
        UPDATE tasks
        SET
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = :task_id
          AND user_id = :user_id
        RETURNING
            id,
            user_id,
            title,
            description,
            status,
            priority,
            due_at,
            created_at,
            updated_at,
            completed_at
    """)

    result = db.execute(
        query,
        {
            "task_id": task_id,
            "user_id": user_id,
        }
    )

    row = result.fetchone()

    if row is None:
        db.rollback()
        return None

    db.commit()

    return dict(row._mapping)

def delete_task(
    db: Session,
    user_id: str,
    task_id: str,
):
    query = text("""
        UPDATE tasks
        SET
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE id = :task_id
          AND user_id = :user_id
          AND deleted_at IS NULL
        RETURNING
            id,
            user_id,
            project_id,
            title,
            description,
            status,
            priority,
            due_at,
            created_at,
            updated_at,
            completed_at,
            deleted_at
    """)

    result = db.execute(
        query,
        {
            "task_id": task_id,
            "user_id": user_id,
        }
    )

    row = result.fetchone()

    if row is None:
        db.rollback()
        return None

    db.commit()

    return dict(row._mapping)


def get_tasks(
    db: Session,
    user_id: str,
    status: str | None = None,
):
    query = text("""
        SELECT
            id,
            user_id,
            project_id,
            title,
            description,
            status,
            priority,
            due_at,
            created_at,
            updated_at,
            completed_at,
            deleted_at
        FROM tasks
        WHERE user_id = :user_id
          AND deleted_at IS NULL
          AND (
              CAST(:status AS TEXT) IS NULL
              OR status = CAST(:status AS TEXT)
          )
        ORDER BY created_at DESC
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id,
            "status": status,
        }
    )

    return [
        dict(row._mapping)
        for row in result
    ]

def get_deleted_tasks(
    db: Session,
    user_id: str,
):
    query = text("""
        SELECT
            id,
            user_id,
            project_id,
            title,
            description,
            status,
            priority,
            due_at,
            created_at,
            updated_at,
            completed_at,
            deleted_at
        FROM tasks
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
