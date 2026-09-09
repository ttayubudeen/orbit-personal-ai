TASK_TOOLS = [
    {
        "type": "function",
        "name": "get_active_tasks",
        "description": "Get all active tasks belonging to the current user.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "type": "function",
        "name": "get_task",
        "description": "Get detailed information about a specific task.",
        "parameters": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "The UUID of the task.",
                }
            },
            "required": ["task_id"],
        },
    },
    {
        "type": "function",
        "name": "get_today_meetings",
        "description": "Get all meetings scheduled for today.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "type": "function",
        "name": "get_next_meeting",
        "description": "Get the user's next upcoming meeting.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },


    {
        "type": "function",
        "name": "create_task",
        "description": "Create a new task for the user.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The task title."
                },
                "description": {
                    "type": "string",
                    "description": "Optional detailed description of the task."
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "Task priority."
                },
                "due_at": {
                    "type": "string",
                    "description": "Optional due date/time in ISO 8601 format."
                }
            },
            "required": ["title"]
        }
    },
    {
        "type": "function",
        "name": "update_task",
        "description": "Update an existing task.",
        "parameters": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "The UUID of the task to update."
                },
                "title": {
                    "type": "string",
                    "description": "New task title."
                },
                "description": {
                    "type": "string",
                    "description": "New task description."
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "New task priority."
                },
                "due_at": {
                    "type": "string",
                    "description": "New due date/time in ISO 8601 format."
                }
            },
            "required": ["task_id"]
        }
    },
    {
        "type": "function",
        "name": "complete_task",
        "description": "Mark an existing task as completed.",
        "parameters": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "The UUID of the task to complete."
                }
            },
            "required": ["task_id"]
        }
    },
    {
        "type": "function",
        "name": "create_meeting",
        "description": "Schedule an interview or other event for the user.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Name of the interview or scheduled event."
                },
                "description": {
                    "type": "string",
                    "description": "Optional details about the interview."
                },
                "start_at": {
                    "type": "string",
                    "description": "Start date and time in ISO 8601 format."
                },
                "end_at": {
                    "type": "string",
                    "description": "Optional end date and time in ISO 8601 format."
                },
                "location": {
                    "type": "string",
                    "description": "Interview location or meeting link."
                }
            },
            "required": ["title", "start_at"]
        }
    },

    {
        "type": "function",
        "name": "update_meeting",
        "description": "Update or reschedule an interview or scheduled event.",
        "parameters": {
            "type": "object",
            "properties": {
                "meeting_id": {
                    "type": "string",
                    "description": "UUID of the meeting or interview."
                },
                "title": {
                    "type": "string"
                },
                "description": {
                    "type": "string"
                },
                "start_at": {
                    "type": "string",
                    "description": "New start date/time in ISO 8601 format."
                },
                "end_at": {
                    "type": "string",
                    "description": "New end date/time in ISO 8601 format."
                },
                "location": {
                    "type": "string"
                }
            },
            "required": ["meeting_id"]
        }
    },

    {
        "type": "function",
        "name": "get_tasks",
        "description": "Get the user's tasks. Can retrieve active tasks, completed tasks, or all tasks.",
        "parameters": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["active", "completed"],
                    "description": "Optional task status filter. Omit it to retrieve tasks regardless of status."
                }
            },
            "required": []
        }
    },
    {
        "type": "function",
        "name": "get_meetings",
        "description": "Get all meetings and scheduled events belonging to the current user.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "type": "function",
        "name": "get_deleted_tasks",
        "description": "Get tasks that have been moved to the recycle bin.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "type": "function",
        "name": "get_deleted_meetings",
        "description": "Get meetings and interviews that have been moved to the recycle bin.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "type": "function",
        "name": "delete_task",
        "description": "Move a task to the recycle bin.",
        "parameters": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "UUID of the task to move to the recycle bin.",
                }
            },
            "required": ["task_id"],
        },
    },

    {
        "type": "function",
        "name": "delete_meeting",
        "description": "Move a meeting or interview to the recycle bin.",
        "parameters": {
            "type": "object",
            "properties": {
                "meeting_id": {
                    "type": "string",
                    "description": "UUID of the meeting or interview to move to the recycle bin.",
                }
            },
            "required": ["meeting_id"],
        },
    },
        {
        "type": "function",
        "name": "search_memories",
        "description": "Search the user's saved memories for information relevant to the current conversation.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The information or topic to search for in the user's memories.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of memories to return.",
                    "default": 5,
                },
            },
            "required": ["query"],
        },
    },

    {
        "type": "function",
        "name": "get_memory",
        "description": "Get a specific saved memory by its UUID.",
        "parameters": {
            "type": "object",
            "properties": {
                "memory_id": {
                    "type": "string",
                    "description": "UUID of the memory.",
                },
            },
            "required": ["memory_id"],
        },
    },

    {
        "type": "function",
        "name": "create_memory",
        "description": "Save useful information about the user as a memory for future conversations.",
        "parameters": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "The information that should be remembered.",
                },
                "category": {
                    "type": "string",
                    "description": "Category of the memory, such as preference, personal, career, project, or goal.",
                },
                "importance": {
                    "type": "integer",
                    "description": "Importance from 1 to 5, where 5 is extremely important.",
                    "minimum": 1,
                    "maximum": 5,
                },
            },
            "required": ["content"],
        },
    },


]