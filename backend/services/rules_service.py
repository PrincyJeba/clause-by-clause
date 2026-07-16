"""
Everything to do with reading the rule base and the DLSA directory.
This is the only file that touches the JSON files. If you ever move
this data into a real database, this is the only file that changes.
"""
import json
from functools import lru_cache

from config import RENTAL_RULES_PATH, LOAN_RULES_PATH, DLSA_DATA_PATH


@lru_cache
def _rental_rules():
    with open(RENTAL_RULES_PATH) as f:
        return json.load(f)


@lru_cache
def _loan_rules():
    with open(LOAN_RULES_PATH) as f:
        return json.load(f)


@lru_cache
def _dlsa_data():
    with open(DLSA_DATA_PATH) as f:
        return json.load(f)


def get_rules(doc_type: str) -> dict:
    return _rental_rules() if doc_type == "rental" else _loan_rules()


def find_clause(clause_type: str, doc_type: str) -> dict | None:
    rules = get_rules(doc_type)
    for clause in rules["clauses"]:
        if clause["clause_type"] == clause_type:
            return clause
    return None


def act_name(doc_type: str) -> str:
    return get_rules(doc_type)["act"]


def get_dlsa_office(district: str) -> dict:
    data = _dlsa_data()
    for office in data["offices"]:
        if office["district"].lower() == district.lower():
            return office
    return {
        "district": district,
        "office": "Tamil Nadu State Legal Services Authority",
        "address": "High Court Buildings, Chennai - 600 104",
        "phone": data["helpline"],
        "email": data["general_email"],
    }


def general_email() -> str:
    return _dlsa_data()["general_email"]
