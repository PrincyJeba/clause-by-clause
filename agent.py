import json
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
import datetime

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
MODEL = "gemini-2.5-flash-lite"

with open("rules/rental_tn.json") as f:
    RENTAL_RULES = json.load(f)

with open("rules/loan_tn.json") as f:
    LOAN_RULES = json.load(f)

with open("data/dlsa_tn.json") as f:
    DLSA_DATA = json.load(f)


def get_rules(doc_type):
    return RENTAL_RULES if doc_type == "rental" else LOAN_RULES


def get_dlsa_office(district):
    for office in DLSA_DATA["offices"]:
        if office["district"].lower() == district.lower():
            return office
    return {
        "district": district,
        "office": "Tamil Nadu State Legal Services Authority",
        "address": "High Court Buildings, Chennai - 600 104",
        "phone": DLSA_DATA["helpline"],
        "email": DLSA_DATA["general_email"]
    }


# tool definitions in Gemini format
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
                )
            ),
            "doc_type": types.Schema(
                type=types.Type.STRING,
                enum=["rental", "loan"],
                description="Whether this is from a rental agreement or a loan note."
            )
        },
        required=["clause_type", "doc_type"]
    )
)

draft_counter_declaration = types.FunctionDeclaration(
    name="draft_counter_message",
    description=(
        "Draft a polite but firm counter-message the user can send to the landlord "
        "or lender to dispute the identified risky clause. Returns a ready-to-send "
        "message in plain English grounded in Tamil Nadu law."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "clause_type": types.Schema(
                type=types.Type.STRING,
                description="The clause type that was identified as high risk."
            ),
            "doc_type": types.Schema(
                type=types.Type.STRING,
                enum=["rental", "loan"]
            )
        },
        required=["clause_type", "doc_type"]
    )
)

draft_complaint_declaration = types.FunctionDeclaration(
    name="draft_dlsa_complaint",
    description=(
        "Draft a formal complaint letter addressed to the District Legal Services "
        "Authority (DLSA) in Tamil Nadu describing the legal violation found in the "
        "clause and requesting legal aid or intervention."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "user_name": types.Schema(
                type=types.Type.STRING,
                description="Full name of the person filing the complaint."
            ),
            "district": types.Schema(
                type=types.Type.STRING,
                description="The district in Tamil Nadu where the user is located."
            ),
            "clause_text": types.Schema(
                type=types.Type.STRING,
                description="The exact clause text that was identified as problematic."
            ),
            "clause_type": types.Schema(
                type=types.Type.STRING,
                description="The category of the clause."
            ),
            "legal_violation": types.Schema(
                type=types.Type.STRING,
                description="Plain description of what law is being violated and how."
            ),
            "legal_citation": types.Schema(
                type=types.Type.STRING,
                description="The section and act name being violated."
            ),
            "doc_type": types.Schema(
                type=types.Type.STRING,
                enum=["rental", "loan"]
            )
        },
        required=[
            "user_name", "district", "clause_text",
            "clause_type", "legal_violation", "legal_citation", "doc_type"
        ]
    )
)

tools = types.Tool(
    function_declarations=[
        check_clause_declaration,
        draft_counter_declaration,
        draft_complaint_declaration
    ]
)


def execute_tool(tool_name, args):
    if tool_name == "check_clause_against_law":
        rules = get_rules(args["doc_type"])
        for clause in rules["clauses"]:
            if clause["clause_type"] == args["clause_type"]:
                return {
                    "found": True,
                    "risk_level": "HIGH",
                    "legal_limit": clause["legal_limit"],
                    "section": clause["section"],
                    "plain_explanation": clause["plain_explanation"],
                    "act": rules["act"]
                }
        return {
            "found": False,
            "risk_level": "UNCLEAR",
            "note": (
                "This clause type is not in the current rule base. "
                "Manual review by a legal professional is recommended."
            )
        }

    elif tool_name == "draft_counter_message":
        rules = get_rules(args["doc_type"])
        for clause in rules["clauses"]:
            if clause["clause_type"] == args["clause_type"]:
                return {"counter_message": clause["counter_message"]}
        return {
            "counter_message": (
                "I have concerns about this clause as it may not comply with "
                "applicable Tamil Nadu law. I request that this clause be "
                "reviewed and revised before I agree to sign this agreement."
            )
        }

    elif tool_name == "draft_dlsa_complaint":
        dlsa = get_dlsa_office(args["district"])
        doc_label = (
            "rental agreement" if args["doc_type"] == "rental"
            else "loan agreement"
        )
        today = datetime.date.today().strftime("%d %B %Y")

        complaint = f"""To,
The Secretary,
{dlsa['office']},
{dlsa['address']}

Subject: Complaint Regarding Illegal Clause in {doc_label.title()} - Request for Legal Aid

Respected Sir/Madam,

I, {args['user_name']}, a resident of {args['district']} district, Tamil Nadu, \
am writing to bring to your attention an illegal clause in a {doc_label} \
presented to me for signing.

The clause in question reads as follows:

"{args['clause_text']}"

This clause violates {args['legal_citation']}.

Specifically: {args['legal_violation']}

I am from a low-income background and do not have the means to engage a \
private lawyer. I am requesting your authority's assistance in:
1. Advising me on my legal rights in this matter
2. If appropriate, issuing a notice or taking action against the other party

I am available to provide any further information or documents required.

Thanking you,

{args['user_name']}
{args['district']}, Tamil Nadu
Date: {today}

Note: This complaint was prepared with the assistance of Clause by Clause,
a free legal literacy tool for Tamil Nadu residents.
Free Legal Aid Helpline: 15100"""

        return {
            "complaint_text": complaint,
            "dlsa_office": dlsa["office"],
            "dlsa_email": dlsa.get("email", DLSA_DATA["general_email"]),
            "dlsa_phone": dlsa["phone"],
            "dlsa_address": dlsa["address"]
        }

    return {"error": f"Unknown tool: {tool_name}"}


def analyze_clause(clause_text, doc_type, district):
    rules = get_rules(doc_type)
    act_name = rules["act"]

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
        "error": None
    }

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part(
                    text=(
                        f"Analyze this clause from my {doc_type} agreement:\n\n"
                        f"\"{clause_text}\"\n\n"
                        f"My district in Tamil Nadu: {district}"
                    )
                )
            ]
        )
    ]

    try:
        for _ in range(6):
            response = client.models.generate_content(
                model=MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    tools=[tools],
                    temperature=0.2
                )
            )

            candidate = response.candidates[0]
            content = candidate.content

            has_function_calls = any(
                hasattr(part, "function_call") and part.function_call
                for part in content.parts
            )

            if has_function_calls:
                contents.append(content)
                function_response_parts = []

                for part in content.parts:
                    if hasattr(part, "function_call") and part.function_call:
                        fn_name = part.function_call.name
                        fn_args = dict(part.function_call.args)
                        tool_output = execute_tool(fn_name, fn_args)

                        if fn_name == "check_clause_against_law":
                            result["clause_type"] = fn_args.get("clause_type")
                            result["risk_level"] = tool_output.get("risk_level")
                            result["legal_limit"] = tool_output.get("legal_limit")
                            if tool_output.get("found"):
                                result["legal_citation"] = tool_output.get("section")
                                result["plain_explanation"] = tool_output.get(
                                    "plain_explanation"
                                )

                        elif fn_name == "draft_counter_message":
                            result["counter_message"] = tool_output.get("counter_message")

                        function_response_parts.append(
                            types.Part(
                                function_response=types.FunctionResponse(
                                    name=fn_name,
                                    response={"result": tool_output}
                                )
                            )
                        )

                contents.append(
                    types.Content(role="user", parts=function_response_parts)
                )

            else:
                for part in content.parts:
                    if hasattr(part, "text") and part.text:
                        result["summary"] = part.text
                break

    except Exception as e:
        result["error"] = str(e)

    return result


def generate_dlsa_complaint(
    user_name,
    clause_text,
    clause_type,
    doc_type,
    plain_explanation,
    legal_citation,
    district
):
    legal_violation = (
        f"{plain_explanation} The applicable law is {legal_citation}."
    )

    args = {
        "user_name": user_name,
        "district": district,
        "clause_text": clause_text,
        "clause_type": clause_type,
        "legal_violation": legal_violation,
        "legal_citation": legal_citation,
        "doc_type": doc_type
    }

    return execute_tool("draft_dlsa_complaint", args)