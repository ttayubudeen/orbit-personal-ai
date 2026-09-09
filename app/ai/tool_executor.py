from sqlalchemy.orm import Session

from app.services.tasks import (
    get_active_tasks,
    get_task,
    get_tasks,
    get_deleted_tasks,
    create_task,
    update_task,
    complete_task,
    delete_task,
)


from app.services.meetings import (
    get_today_meetings,
    get_next_meeting,
    get_meetings,
    get_deleted_meetings,
    create_meeting,
    update_meeting,
    delete_meeting,
)

from app.services.memories import (
    search_memories,
    get_memory,
    create_memory,
)



def execute_tool(
    db: Session,
    user_id: str,
    tool_name: str,
    arguments: dict,
):
    if tool_name == "get_active_tasks":
        return get_active_tasks(
            db=db,
            user_id=user_id,
        )

    if tool_name == "get_task":
        return get_task(
            db=db,
            user_id=user_id,
            task_id=arguments["task_id"],
        )

    if tool_name == "get_today_meetings":
        return get_today_meetings(
            db=db,
            user_id=user_id,
        )

    if tool_name == "get_next_meeting":
        return get_next_meeting(
            db=db,
            user_id=user_id,
        )

    if tool_name == "create_task":
        return create_task(
            db=db,
            user_id=user_id,
            title=arguments["title"],
            description=arguments.get("description"),
            priority=arguments.get("priority", "medium"),
            due_at=arguments.get("due_at"),
        )

    if tool_name == "update_task":
        return update_task(
            db=db,
            user_id=user_id,
            task_id=arguments["task_id"],
            title=arguments.get("title"),
            description=arguments.get("description"),
            priority=arguments.get("priority"),
            due_at=arguments.get("due_at"),
        )

    if tool_name == "complete_task":
        return complete_task(
            db=db,
            user_id=user_id,
            task_id=arguments["task_id"],
        )

    if tool_name == "create_meeting":
        return create_meeting(
            db=db,
            user_id=user_id,
            title=arguments["title"],
            description=arguments.get("description"),
            start_at=arguments.get("start_at"),
            end_at=arguments.get("end_at"),
            location=arguments.get("location"),
            project_id=arguments.get("project_id"),
        )

    if tool_name == "delete_task":
        return delete_task(
            db=db,
            user_id=user_id,
            task_id=arguments["task_id"],
        )

    if tool_name == "update_meeting":
        return update_meeting(
            db=db,
            user_id=user_id,
            meeting_id=arguments["meeting_id"],
            title=arguments.get("title"),
            description=arguments.get("description"),
            start_at=arguments.get("start_at"),
            end_at=arguments.get("end_at"),
            location=arguments.get("location"),
        )

    if tool_name == "delete_meeting":
        return delete_meeting(
            db=db,
            user_id=user_id,
            meeting_id=arguments["meeting_id"],
        )

    if tool_name == "get_tasks":
        return get_tasks(
            db=db,
            user_id=user_id,
            status=arguments.get("status"),
        )

    if tool_name == "get_meetings":
        return get_meetings(
            db=db,
            user_id=user_id,
        )

    if tool_name == "get_deleted_tasks":
        return get_deleted_tasks(
            db=db,
            user_id=user_id,
        )

    if tool_name == "get_deleted_meetings":
        return get_deleted_meetings(
            db=db,
            user_id=user_id,
        )

    if tool_name == "search_memories":
        return search_memories(
            db=db,
            user_id=user_id,
            query_text=arguments["query"],
            limit=arguments.get("limit", 5),
        )

    if tool_name == "get_memory":
        return get_memory(
            db=db,
            user_id=user_id,
            memory_id=arguments["memory_id"],
        )

    if tool_name == "create_memory":
        return create_memory(
            db=db,
            user_id=user_id,
            content=arguments["content"],
            category=arguments.get("category"),
            importance=arguments.get("importance", 3),
        )


    raise ValueError(f"Unknown tool: {tool_name}")
