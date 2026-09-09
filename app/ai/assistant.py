import os
import json
import logging

from dotenv import load_dotenv
from google import genai
from google.genai import types
from openai import OpenAI
from groq import Groq

from app.ai.tools import TASK_TOOLS
from app.ai.tool_executor import execute_tool
from app.ai.provider_router import run_with_fallbacks
from app.services.llm_usage import record_llm_usage


# ============================================================
# SETUP
# ============================================================

load_dotenv()

logger = logging.getLogger(__name__)

def get_usage_value(usage, *names):
    if usage is None:
        return 0

    for name in names:
        value = getattr(usage, name, None)

        if value is not None:
            try:
                return int(value)
            except (TypeError, ValueError):
                return 0

    return 0


def record_provider_usage(
    db,
    user_id,
    provider,
    model,
    usage,
    success=True,
):
    if provider == "Gemini":
        input_tokens = get_usage_value(
            usage,
            "prompt_token_count",
            "input_tokens",
        )

        output_tokens = get_usage_value(
            usage,
            "candidates_token_count",
            "output_tokens",
        )

        total_tokens = get_usage_value(
            usage,
            "total_token_count",
            "total_tokens",
        )

    elif provider == "Groq":
        input_tokens = get_usage_value(
            usage,
            "prompt_tokens",
            "input_tokens",
        )

        output_tokens = get_usage_value(
            usage,
            "completion_tokens",
            "output_tokens",
        )

        total_tokens = get_usage_value(
            usage,
            "total_tokens",
        )

    elif provider == "OpenAI":
        input_tokens = get_usage_value(
            usage,
            "input_tokens",
            "prompt_tokens",
        )

        output_tokens = get_usage_value(
            usage,
            "output_tokens",
            "completion_tokens",
        )

        total_tokens = get_usage_value(
            usage,
            "total_tokens",
        )

    else:
        input_tokens = 0
        output_tokens = 0
        total_tokens = 0

    if total_tokens == 0:
        total_tokens = input_tokens + output_tokens

    record_llm_usage(
        db=db,
        user_id=user_id,
        provider=provider,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        success=success,
    )

# ============================================================
# CLIENTS
# ============================================================

gemini_api_key = os.getenv("GEMINI_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")


gemini_client = (
    genai.Client(
        api_key=gemini_api_key,
        http_options=types.HttpOptions(
            timeout=30000
        ),
    )
    if gemini_api_key
    else None
)


groq_client = (
    Groq(api_key=groq_api_key)
    if groq_api_key
    else None
)

openai_client = (
    OpenAI(api_key=openai_api_key)
    if openai_api_key
    else None
)


# ============================================================
# MODEL CONFIGURATION
# ============================================================


MODEL_PRIORITY = [
    ("Gemini", "gemini-3.7-flash"),
    ("Gemini", "gemini-3.6-flash"),
    ("Gemini", "gemini-3.5-flash"),
    ("Groq", "openai/gpt-oss-120b"),
    ("Gemini", "gemini-3.1-flash-lite"),
    ("Groq", "openai/gpt-oss-20b"),
    ("Gemini", "gemini-3.5-flash-lite"),
    ("Gemini", "gemini-2.5-flash"),
    ("Gemini", "gemini-2.5-flash-lite"),
    ("OpenAI", "gpt-5.6-luna"),
]

OPENAI_MODEL = "gpt-5.6-luna"



# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are a personal AI assistant.

You help the user manage tasks, meetings, projects,
and personal information.

Be natural, concise, and conversational.

Use the available tools whenever you need information
from the user's database.

Do not claim that you performed an action unless the
application actually performed that action.

If the user asks something that cannot be answered from
the available information, say so rather than inventing
information.

Use memory tools when the user's request depends on
information that may have been saved from previous
conversations.

When the user explicitly asks you to remember something
important, use create_memory.

Do not create memories for every message.

Only save information that is useful for future conversations,
especially:

- durable preferences
- goals
- personal facts
- projects
- important instructions
- recurring problems
- useful long-term context

When answering from memory, do not invent information that
was not returned by the memory tools.


IMPORTANT DELETION RULE:

Never delete a task or meeting immediately when the user
first asks for deletion.

First identify the specific item and ask the user for
confirmation.

Only call delete_task or delete_meeting after the user has
clearly confirmed the deletion.


IMPORTANT TOOL RULE:

Tools are executed by the application.

Never pretend that a tool was executed if it was not.

After a tool is executed, use its result to produce the
final answer.
"""


# ============================================================
# CONVERSATION
# ============================================================

def build_messages(conversation_messages: list):
    """
    Convert stored conversation messages into the common
    OpenAI/Groq message format.
    """

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    for message in conversation_messages:

        messages.append(
            {
                "role": message["role"],
                "content": message["content"],
            }
        )

    return messages


# ============================================================
# DELETE CONFIRMATION
# ============================================================

def deletion_confirmation_was_given(
    conversation_messages: list,
) -> bool:

    current_user_message = None

    for message in reversed(conversation_messages):

        if message["role"] == "user":

            current_user_message = (
                message["content"]
                .lower()
                .strip()
            )

            break

    if not current_user_message:
        return False

    confirmation_words = {
        "yes",
        "yes delete it",
        "yes, delete it",
        "yes cancel it",
        "yes, cancel it",
        "confirm",
        "confirmed",
        "do it",
        "go ahead",
        "go ahead and delete it",
        "go ahead and cancel it",
    }

    if current_user_message not in confirmation_words:
        return False

    found_current_user = False

    previous_assistant_message = None

    for message in reversed(conversation_messages):

        if (
            message["role"] == "user"
            and not found_current_user
        ):

            found_current_user = True
            continue

        if (
            found_current_user
            and message["role"] == "assistant"
        ):

            previous_assistant_message = (
                message["content"]
                .lower()
            )

            break

    if not previous_assistant_message:
        return False

    return (
        "before i delete" in previous_assistant_message
        or "before i cancel" in previous_assistant_message
        or "confirm" in previous_assistant_message
    )


def make_json_safe(value):
    """
    Convert database/Python objects into values that can safely
    be sent to an LLM API as JSON.

    UUID, datetime, Decimal, and similar objects are converted
    to strings.
    """

    if value is None:
        return None

    if isinstance(value, dict):
        return {
            str(key): make_json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple, set)):
        return [
            make_json_safe(item)
            for item in value
        ]

    # UUID, datetime, Decimal, etc.
    # are safely represented as strings.
    if not isinstance(
        value,
        (str, int, float, bool),
    ):
        return str(value)

    return value


# ============================================================
# TOOL EXECUTION
# ============================================================

def execute_tool_calls(
    db,
    user_id: str,
    tool_calls: list,
):
    """
    Execute application tools and convert their results into
    JSON-safe data before returning them to an LLM provider.
    """

    results = []

    for tool_call in tool_calls:

        result = execute_tool(
            db=db,
            user_id=user_id,
            tool_name=tool_call["name"],
            arguments=tool_call["arguments"],
        )

        safe_result = make_json_safe(result)

        results.append(
            {
                "name": tool_call["name"],
                "call_id": tool_call.get("call_id"),
                "result": safe_result,
            }
        )

    return results


# ============================================================
# OPENAI / GROQ TOOL FORMAT
# ============================================================

def get_openai_tools():
    """
    TASK_TOOLS is expected to use the OpenAI Responses API
    function format:

        {
            "type": "function",
            "name": "...",
            "description": "...",
            "parameters": {...}
        }

    If TASK_TOOLS uses the older nested format, convert it.
    """

    converted_tools = []

    for tool in TASK_TOOLS:

        if tool.get("type") != "function":
            continue

        # Current OpenAI Responses API format
        if "name" in tool:

            converted_tools.append(tool)
            continue

        # Older format:
        #
        # {
        #     "type": "function",
        #     "function": {
        #         "name": "...",
        #         ...
        #     }
        # }

        if "function" in tool:

            function = tool["function"]

            converted_tools.append(
                {
                    "type": "function",
                    "name": function["name"],
                    "description": function.get(
                        "description",
                        "",
                    ),
                    "parameters": function.get(
                        "parameters",
                        {},
                    ),
                }
            )

    return converted_tools


# ============================================================
# GEMINI TOOL FORMAT
# ============================================================

def get_gemini_tools():
    """
    Convert TASK_TOOLS into the Gemini SDK format.

    IMPORTANT:

    Gemini expects:

        config=GenerateContentConfig(
            tools=[
                types.Tool(
                    function_declarations=[...]
                )
            ]
        )

    NOT:

        tools=[
            get_gemini_tools()
        ]

    where get_gemini_tools() itself returns a list.
    """

    function_declarations = []

    for tool in TASK_TOOLS:

        if tool.get("type") != "function":
            continue

        # ----------------------------------------------------
        # Current OpenAI Responses API format
        # ----------------------------------------------------

        if "name" in tool:

            name = tool["name"]

            description = tool.get(
                "description",
                "",
            )

            parameters = tool.get(
                "parameters",
                {},
            )

        # ----------------------------------------------------
        # Older OpenAI function format
        # ----------------------------------------------------

        elif "function" in tool:

            function = tool["function"]

            name = function["name"]

            description = function.get(
                "description",
                "",
            )

            parameters = function.get(
                "parameters",
                {},
            )

        else:
            continue

        function_declarations.append(
            types.FunctionDeclaration(
                name=name,
                description=description,
                parameters=parameters,
            )
        )

    return types.Tool(
        function_declarations=function_declarations
    )


# ============================================================
# GEMINI
# ============================================================

def generate_with_gemini(
    db,
    user_id: str,
    conversation_messages: list,
    model: str,
):

    print("USING GEMINI")

    if gemini_client is None:

        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    messages = build_messages(
        conversation_messages
    )

    # --------------------------------------------------------
    # Deletion confirmation
    # --------------------------------------------------------

    confirmation_allowed = (
        deletion_confirmation_was_given(
            conversation_messages
        )
    )

    if confirmation_allowed:

        messages.insert(
            0,
            {
                "role": "system",
                "content": (
                    "The user has explicitly confirmed "
                    "the deletion or cancellation requested "
                    "in the immediately preceding assistant "
                    "message. You may now call the appropriate "
                    "delete_task or delete_meeting tool."
                ),
            },
        )

    # --------------------------------------------------------
    # Convert messages to Gemini format
    # --------------------------------------------------------

    gemini_contents = []

    for message in messages:

        role = message["role"]

        content = message["content"]

        # System messages are handled through
        # system_instruction.
        if role == "system":
            continue

        gemini_role = (
            "model"
            if role == "assistant"
            else "user"
        )

        gemini_contents.append(
            types.Content(
                role=gemini_role,
                parts=[
                    types.Part.from_text(
                        text=content
                    )
                ],
            )
        )

    # --------------------------------------------------------
    # Gemini configuration
    # --------------------------------------------------------

    gemini_tools = get_gemini_tools()

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=[gemini_tools],
        automatic_function_calling=types.AutomaticFunctionCallingConfig(
            disable=True
        ),
    )

    # --------------------------------------------------------
    # First request
    # --------------------------------------------------------

    try:
        response = gemini_client.models.generate_content(
            model=model,
            contents=gemini_contents,
            config=config,
        )

        record_provider_usage(
            db=db,
            user_id=user_id,
            provider="Gemini",
            model=model,
            usage=getattr(response, "usage_metadata", None),
            success=True,
        )

    except Exception:
        record_provider_usage(
            db=db,
            user_id=user_id,
            provider="Gemini",
            model=model,
            usage=None,
            success=False,
        )
        raise

    # --------------------------------------------------------
    # Tool loop
    # --------------------------------------------------------

    while True:

        if not response.candidates:

            raise RuntimeError(
                "Gemini returned no candidates."
            )

        candidate = response.candidates[0]

        if not candidate.content:

            return response.text or ""

        function_calls = []

        for part in candidate.content.parts:

            if part.function_call:

                function_calls.append(
                    {
                        "name": part.function_call.name,
                        "arguments": dict(
                            part.function_call.args or {}
                        ),
                        "call_id": getattr(
                            part.function_call,
                            "id",
                            None,
                        ),
                    }
                )

        # ----------------------------------------------------
        # No tool calls
        # ----------------------------------------------------

        if not function_calls:

            return response.text or ""

        # ----------------------------------------------------
        # Execute tools
        # ----------------------------------------------------

        tool_results = execute_tool_calls(
            db=db,
            user_id=user_id,
            tool_calls=function_calls,
        )

        # ----------------------------------------------------
        # Preserve Gemini's function-call response
        # ----------------------------------------------------

        gemini_contents.append(
            candidate.content
        )

        # ----------------------------------------------------
        # Send tool results back to Gemini
        # ----------------------------------------------------

        function_response_parts = []

        for tool_result in tool_results:

            function_response_parts.append(
                types.Part.from_function_response(
                    name=tool_result["name"],
                    response={
                        "result": make_json_safe(
                            tool_result["result"]
                        )
                    },
                )
            )

        gemini_contents.append(
            types.Content(
                role="user",
                parts=function_response_parts,
            )
        )

        # ----------------------------------------------------
        # Ask Gemini for final response
        # ----------------------------------------------------

        try:
            response = gemini_client.models.generate_content(
                model=model,
                contents=gemini_contents,
                config=config,
            )

            record_provider_usage(
                db=db,
                user_id=user_id,
                provider="Gemini",
                model=model,
                usage=getattr(response, "usage_metadata", None),
                success=True,
            )

        except Exception:
            record_provider_usage(
                db=db,
                user_id=user_id,
                provider="Gemini",
                model=model,
                usage=None,
                success=False,
            )
            raise


# ============================================================
# GROQ
# ============================================================

def generate_with_groq(
    db,
    user_id: str,
    conversation_messages: list,
    model: str,
):

    print("USING GROQ")

    if groq_client is None:

        raise RuntimeError(
            "GROQ_API_KEY is not configured."
        )

    messages = build_messages(
        conversation_messages
    )

    confirmation_allowed = (
        deletion_confirmation_was_given(
            conversation_messages
        )
    )

    if confirmation_allowed:

        messages.insert(
            0,
            {
                "role": "system",
                "content": (
                    "The user has explicitly confirmed "
                    "the deletion or cancellation requested "
                    "in the immediately preceding assistant "
                    "message. You may now call the appropriate "
                    "delete_task or delete_meeting tool."
                ),
            },
        )

    try:
        response = groq_client.chat.completions.create(
            model=model,
            messages=messages,
            tools=get_openai_tools(),
            tool_choice="auto",
        )

        record_provider_usage(
            db=db,
            user_id=user_id,
            provider="Groq",
            model=model,
            usage=getattr(response, "usage", None),
            success=True,
        )

    except Exception:
        record_provider_usage(
            db=db,
            user_id=user_id,
            provider="Groq",
            model=model,
            usage=None,
            success=False,
        )
        raise

    while True:

        message = response.choices[0].message

        # ----------------------------------------------------
        # No tool call
        # ----------------------------------------------------

        if not message.tool_calls:

            return message.content or ""

        # ----------------------------------------------------
        # Add assistant tool-call message
        # ----------------------------------------------------

        messages.append(
            message
        )

        # ----------------------------------------------------
        # Execute tools
        # ----------------------------------------------------

        for tool_call in message.tool_calls:

            arguments = json.loads(
                tool_call.function.arguments
            )

            result = execute_tool(
                db=db,
                user_id=user_id,
                tool_name=tool_call.function.name,
                arguments=arguments,
            )

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(
                        result,
                        default=str,
                    ),
                }
            )

        # ----------------------------------------------------
        # Continue generation
        # ----------------------------------------------------

        try:
            response = groq_client.chat.completions.create(
                model=model,
                messages=messages,
                tools=get_openai_tools(),
                tool_choice="auto",
            )

            record_provider_usage(
                db=db,
                user_id=user_id,
                provider="Groq",
                model=model,
                usage=getattr(response, "usage", None),
                success=True,
            )

        except Exception:
            record_provider_usage(
                db=db,
                user_id=user_id,
                provider="Groq",
                model=model,
                usage=None,
                success=False,
            )
            raise


# ============================================================
# OPENAI
# ============================================================

def generate_with_openai(
    db,
    user_id: str,
    conversation_messages: list,
):

    print("USING OPENAI")

    if openai_client is None:

        raise RuntimeError(
            "OPENAI_API_KEY is not configured."
        )

    messages = build_messages(
        conversation_messages
    )

    confirmation_allowed = (
        deletion_confirmation_was_given(
            conversation_messages
        )
    )

    if confirmation_allowed:

        messages.insert(
            0,
            {
                "role": "system",
                "content": (
                    "The user has explicitly confirmed "
                    "the deletion or cancellation requested "
                    "in the immediately preceding assistant "
                    "message. You may now call the appropriate "
                    "delete_task or delete_meeting tool."
                ),
            },
        )

    try:
        response = openai_client.responses.create(
            model=OPENAI_MODEL,
            input=messages,
            tools=get_openai_tools(),
        )

        record_provider_usage(
            db=db,
            user_id=user_id,
            provider="OpenAI",
            model=OPENAI_MODEL,
            usage=getattr(response, "usage", None),
            success=True,
        )

    except Exception:
        record_provider_usage(
            db=db,
            user_id=user_id,
            provider="OpenAI",
            model=OPENAI_MODEL,
            usage=None,
            success=False,
        )
        raise

    while True:

        tool_outputs = []

        for item in response.output:

            if item.type != "function_call":
                continue

            arguments = json.loads(
                item.arguments
            )

            result = execute_tool(
                db=db,
                user_id=user_id,
                tool_name=item.name,
                arguments=arguments,
            )

            tool_outputs.append(
                {
                    "type": "function_call_output",
                    "call_id": item.call_id,
                    "output": json.dumps(
                        result,
                        default=str,
                    ),
                }
            )

        # ----------------------------------------------------
        # No tools
        # ----------------------------------------------------

        if not tool_outputs:

            return response.output_text

        # ----------------------------------------------------
        # Continue after tools
        # ----------------------------------------------------

        try:
            response = openai_client.responses.create(
                model=OPENAI_MODEL,
                previous_response_id=response.id,
                input=tool_outputs,
                tools=get_openai_tools(),
            )

            record_provider_usage(
                db=db,
                user_id=user_id,
                provider="OpenAI",
                model=OPENAI_MODEL,
                usage=getattr(response, "usage", None),
                success=True,
            )

        except Exception:
            record_provider_usage(
                db=db,
                user_id=user_id,
                provider="OpenAI",
                model=OPENAI_MODEL,
                usage=None,
                success=False,
            )
            raise


# ============================================================
# MAIN PROVIDER ROUTER
# ============================================================

def generate_response(
    db,
    user_id: str,
    conversation_messages: list,
):

    """
    Provider priority:

    1. Gemini models
    2. Groq models
    3. OpenAI

    The provider_router is responsible for:

    - model cooldowns
    - progressive failure handling
    - skipping unhealthy models
    - restoring model health after success
    - moving to the next model/provider
    """

    providers = []


    for provider, model in MODEL_PRIORITY:

        if provider == "Gemini" and gemini_client is not None:
            providers.append((provider, model))

        elif provider == "Groq" and groq_client is not None:
            providers.append((provider, model))

        elif provider == "OpenAI" and openai_client is not None:
            providers.append((provider, model))




    # --------------------------------------------------------
    # Generation dispatcher
    # --------------------------------------------------------

    def generate_for_provider(
        provider,
        model,
    ):

        if provider == "Gemini":

            return generate_with_gemini(
                db=db,
                user_id=user_id,
                conversation_messages=conversation_messages,
                model=model,
            )

        if provider == "Groq":

            return generate_with_groq(
                db=db,
                user_id=user_id,
                conversation_messages=conversation_messages,
                model=model,
            )

        if provider == "OpenAI":

            return generate_with_openai(
                db=db,
                user_id=user_id,
                conversation_messages=conversation_messages,
            )

        raise ValueError(
            f"Unknown provider: {provider}"
        )

    # --------------------------------------------------------
    # Run fallback system
    # --------------------------------------------------------

    return run_with_fallbacks(
        providers=providers,
        generate_function=generate_for_provider,
    )
