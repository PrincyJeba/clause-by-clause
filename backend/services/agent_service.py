"""
The only file that talks to Gemini. It knows nothing about HTTP and
nothing about how the JSON rule files are stored — it asks
rules_service / dlsa_service for that. If you swap models later,
this is the only file you touch.
"""
from google import genai
from google.genai import types

from config import GOOGLE_API_KEY, GEMINI_MODEL
from services import rules_service, dlsa_service

client = genai.Client(api_key=GOOGLE_API_KEY)

# ---------------------------------------------------------------------
# Tool declarations
# ---------------------------------------------------------------------

check_clause_declaration = types.FunctionDeclaration(
    name="check_clause_against_law",
    description=(
        "Check a specific clause from a Tamil Nadu rental agreement or loan note "
        "against the applicable Tamil Nadu law. Returns risk level, legal limit, "
        "section reference, and plain language explanation."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "clause_type": types.Schema(
                type=types.Type.STRING,
                description=(
                    "The category of the clause. For rental, must be one of: "
                    "security_deposit, eviction_notice, rent_increase, "
                    "deposit_forfeiture, lock_in_period, maintenance_responsibility. "
                    "For loan, must be one of: interest_rate, compound_interest, "
                    "lender_license, written_receipt, asset_seizure, penalty_clause."
                ),
            ),
            "doc_type": types.Schema(
                type=types.Type.STRING,
                enum=["rental", "loan"],
                description="Whether this is from a rental agreement or a loan note.",
            ),
            "clause_text": types.Schema(
                type=types.Type.STRING,
                description=(
                    "The exact text of this clause as it appears in the source "
                    "document, verbatim or as close as possible. Required when "
                    "reading from an image; optional otherwise."
                ),
            ),
        },
        required=["clause_type", "doc_type"],
    ),
)

draft_counter_declaration = types.FunctionDeclaration(
    name="draft_counter_message",
    description=(
        "Draft a polite but firm counter-message the user can send to the landlord "
        "or lender to dispute the identified risky clause."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "clause_type": types.Schema(type=types.Type.STRING),
            "doc_type": types.Schema(type=types.Type.STRING, enum=["rental", "loan"]),
        },
        required=["clause_type", "doc_type"],
    ),
)

TOOLS = types.Tool(
    function_declarations=[check_clause_declaration, draft_counter_declaration]
)

# ---------------------------------------------------------------------
# Tool execution (talks only to rules_service, never to the JSON files directly)
# ---------------------------------------------------------------------


def _execute_tool(tool_name: str, args: dict, lang: str = "en") -> dict:
    if tool_name == "check_clause_against_law":
        clause = rules_service.find_clause(args["clause_type"], args["doc_type"])
        if clause:
            localized = rules_service.localize_clause(clause, lang)
            return {
                "found": True,
                "risk_level": "HIGH",
                "legal_limit": localized["legal_limit"],
                "section": localized["section"],
                "plain_explanation": localized["plain_explanation"],
                "act": rules_service.act_name(args["doc_type"], lang),
            }
        return {
            "found": False,
            "risk_level": "UNCLEAR",
            "note": (
                "இந்த வகை விதி தற்போதைய விதி தளத்தில் இல்லை. "
                "ஒரு சட்ட நிபுணரின் நேரடி மதிப்பாய்வு பரிந்துரைக்கப்படுகிறது."
                if lang == "ta"
                else (
                    "This clause type is not in the current rule base. "
                    "Manual review by a legal professional is recommended."
                )
            ),
        }

    if tool_name == "draft_counter_message":
        clause = rules_service.find_clause(args["clause_type"], args["doc_type"])
        if clause:
            localized = rules_service.localize_clause(clause, lang)
            return {"counter_message": localized["counter_message"]}
        if lang == "ta":
            return {
                "counter_message": (
                    "இந்த விதி தமிழ்நாடு சட்டத்திற்கு இணங்காமல் இருக்கலாம் என்று "
                    "எனக்கு கவலை உள்ளது. கையொப்பமிடும் முன் இந்த விதியை மறுஆய்வு "
                    "செய்து திருத்த வேண்டும் என கோருகிறேன்."
                )
            }
        return {
            "counter_message": (
                "I have concerns about this clause as it may not comply with "
                "applicable Tamil Nadu law. I request that this clause be "
                "reviewed and revised before I agree to sign this agreement."
            )
        }

    return {"error": f"Unknown tool: {tool_name}"}


# ---------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------


def analyze_clause(clause_text: str, doc_type: str, district: str, lang: str = "en") -> dict:
    act_name = rules_service.act_name(doc_type)

    system_prompt = (
        f"You are the Clause by Clause agent, a legal assistant for Tamil Nadu, India. "
        f"You help people with low legal literacy understand and respond to contract clauses. "
        f"The document type is: {doc_type}. "
        f"The applicable Tamil Nadu law is: {act_name}. "
        f"Your task: "
        f"1. Call check_clause_against_law to identify the clause type and evaluate risk. "
        f"2. If risk is HIGH, call draft_counter_message to prepare a response for the user. "
        f"3. Return a clear, plain-English summary of your findings. "
        f"Important rules: "
        f"Always classify the clause into one of the known clause types from the rule base. "
        f"Explain in simple language a person with limited legal literacy can understand. "
        f"Do not use legal jargon in your final summary. "
        f"Be direct about whether the clause is problematic or not."
    )

    result = {
        "clause_type": None,
        "risk_level": None,
        "legal_limit": None,
        "legal_citation": None,
        "plain_explanation": None,
        "counter_message": None,
        "summary": None,
        "error": None,
    }

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part(
                    text=(
                        f'Analyze this clause from my {doc_type} agreement:\n\n'
                        f'"{clause_text}"\n\n'
                        f"My district in Tamil Nadu: {district}"
                    )
                )
            ],
        )
    ]

    try:
        for _ in range(6):
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    tools=[TOOLS],
                    temperature=0.2,
                ),
            )

            content = response.candidates[0].content
            has_function_calls = any(
                getattr(part, "function_call", None) for part in content.parts
            )

            if not has_function_calls:
                for part in content.parts:
                    if getattr(part, "text", None):
                        result["summary"] = part.text
                break

            contents.append(content)
            function_response_parts = []

            for part in content.parts:
                if not getattr(part, "function_call", None):
                    continue
                fn_name = part.function_call.name
                fn_args = dict(part.function_call.args)
                tool_output = _execute_tool(fn_name, fn_args, lang)

                if fn_name == "check_clause_against_law":
                    result["clause_type"] = fn_args.get("clause_type")
                    result["risk_level"] = tool_output.get("risk_level")
                    result["legal_limit"] = tool_output.get("legal_limit")
                    if tool_output.get("found"):
                        result["legal_citation"] = tool_output.get("section")
                        result["plain_explanation"] = tool_output.get("plain_explanation")

                elif fn_name == "draft_counter_message":
                    result["counter_message"] = tool_output.get("counter_message")

                function_response_parts.append(
                    types.Part(
                        function_response=types.FunctionResponse(
                            name=fn_name, response={"result": tool_output}
                        )
                    )
                )

            contents.append(types.Content(role="user", parts=function_response_parts))

    except Exception as e:
        result["error"] = str(e)

    return result


def analyze_contract_image(
    image_bytes: bytes, mime_type: str, doc_type: str, district: str, lang: str = "en"
) -> dict:
    """
    Same tool-calling pattern as analyze_clause, but a document photo can
    contain several clauses at once. Gemini is instructed to call
    check_clause_against_law once per distinct clause it finds, and this
    function collects every call into a list instead of a single result.
    """
    act_name = rules_service.act_name(doc_type)

    system_prompt = (
        f"You are the Clause by Clause agent, a legal assistant for Tamil Nadu, India. "
        f"You will be shown a photo of a {doc_type} agreement. The applicable Tamil "
        f"Nadu law is: {act_name}. "
        f"Read all the text in the image carefully, even if it is angled, slightly "
        f"blurry, handwritten, or has uneven lighting. "
        f"Identify EVERY distinct clause in the document that matches one of the known "
        f"clause types, and call check_clause_against_law separately for EACH one you "
        f"find — do not skip any, and do not merge multiple clauses into a single call. "
        f"Always pass the exact clause_text you read for each clause. "
        f"After checking a clause, if its risk is HIGH, call draft_counter_message for "
        f"that same clause_type before moving to the next clause. "
        f"If part of the image is unreadable, skip only that part rather than guessing, "
        f"and mention it in your final summary. "
        f"Once you have checked every clause you can find, give your final summary as ONE or TWO short "
        f"sentences only — an overall verdict (e.g. how many clauses are risky, and whether the person "
        f"should sign, negotiate, or avoid signing as-is). Do not use legal jargon, do not repeat the "
        f"detailed explanation of each individual clause (that is shown separately), and do not exceed "
        f"two sentences."
    )

    result = {"clauses": [], "summary": None, "error": None}

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part(
                    text=f"Analyze this {doc_type} agreement photo. My district in Tamil Nadu: {district}"
                ),
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
        )
    ]

    try:
        for _ in range(12):  # a multi-clause document needs more tool-call rounds
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    tools=[TOOLS],
                    temperature=0.2,
                ),
            )

            content = response.candidates[0].content
            has_function_calls = any(
                getattr(part, "function_call", None) for part in content.parts
            )

            if not has_function_calls:
                for part in content.parts:
                    if getattr(part, "text", None):
                        result["summary"] = part.text
                break

            contents.append(content)
            function_response_parts = []

            for part in content.parts:
                if not getattr(part, "function_call", None):
                    continue
                fn_name = part.function_call.name
                fn_args = dict(part.function_call.args)
                tool_output = _execute_tool(fn_name, fn_args, lang)

                if fn_name == "check_clause_against_law":
                    result["clauses"].append({
                        "clause_type": fn_args.get("clause_type"),
                        "clause_text": fn_args.get("clause_text", ""),
                        "risk_level": tool_output.get("risk_level"),
                        "legal_limit": tool_output.get("legal_limit"),
                        "legal_citation": tool_output.get("section") if tool_output.get("found") else None,
                        "plain_explanation": (
                            tool_output.get("plain_explanation")
                            if tool_output.get("found")
                            else tool_output.get("note")
                        ),
                        "counter_message": None,
                    })

                elif fn_name == "draft_counter_message":
                    # Match to the most recent clause of the same type that
                    # doesn't have a counter-message yet.
                    for entry in reversed(result["clauses"]):
                        if entry["clause_type"] == fn_args.get("clause_type") and entry["counter_message"] is None:
                            entry["counter_message"] = tool_output.get("counter_message")
                            break

                function_response_parts.append(
                    types.Part(
                        function_response=types.FunctionResponse(
                            name=fn_name, response={"result": tool_output}
                        )
                    )
                )

            contents.append(types.Content(role="user", parts=function_response_parts))

    except Exception as e:
        result["error"] = str(e)

    return result


def generate_dlsa_complaint(
    user_name: str,
    clause_text: str,
    clause_type: str,
    doc_type: str,
    plain_explanation: str,
    legal_citation: str,
    district: str,
) -> dict:
    legal_violation = f"{plain_explanation} The applicable law is {legal_citation}."
    return dlsa_service.build_complaint(
        user_name=user_name,
        district=district,
        clause_text=clause_text,
        legal_violation=legal_violation,
        legal_citation=legal_citation,
        doc_type=doc_type,
    )