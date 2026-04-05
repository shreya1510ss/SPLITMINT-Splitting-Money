import os
import json
from google import genai
from google.genai import types
from typing import List, Optional
from schemas.ai import AIExpenseExtraction, AIGroupSummary, AISettlementSuggestion
from schemas.expense import SplitMode
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    client = None

class AIService:
    @staticmethod
    async def extract_expense(text: str, participants: List[str]) -> AIExpenseExtraction:
        if not client:
            raise Exception("Gemini API key not configured")

        prompt = f"""
        Extract expense details from this text: "{text}"
        Available participants: {', '.join(participants)}
        
        Rules:
        - split_mode must be one of: 'equal', 'custom', 'percentage'
        - 'equal': Default mode.
        - 'percentage': Use if text mentions ratios (e.g., '60/40', '50-50', '20% each').
        - 'custom': Use if text mentions specific amounts for each person (e.g., 'I pay 200, Sandy 300').
        - If 'custom' or 'percentage', return split_details as a list of objects each containing 'name' (string) and 'value' (float).
        - If 'I paid' or 'me', map that name to the current user (if null, leave as null).
        - Use context to decide who paid (payer_name).
        """
        
        try:
            # Using the exact model from the user's AI Studio screenshot
            response = client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type='application/json',
                    response_schema=AIExpenseExtraction,
                ),
            )
            return response.parsed
        except Exception as e:
            raise Exception(f"AI Extraction Error: {str(e)}")

    @staticmethod
    async def generate_group_summary(expenses: List[dict], participants: List[str]) -> AIGroupSummary:
        if not client:
            raise Exception("Gemini API key not configured")

        expenses_summary = "\n".join([f"- {e['description']}: {e['amount']} paid by {e['payer_name']}" for e in expenses])
        
        prompt = f"""
        Summarize the spending for this group:
        Participants: {', '.join(participants)}
        Expenses:
        {expenses_summary}
        
        Provide a friendly, readable summary of group spending and dynamics.
        """
        
        try:
            response = client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type='application/json',
                    response_schema=AIGroupSummary,
                ),
            )
            return response.parsed
        except Exception as e:
            raise Exception(f"AI Summary Error: {str(e)}")

    @staticmethod
    async def suggest_settlements(balances: dict, transactions: List[dict]) -> AISettlementSuggestion:
        if not client:
            raise Exception("Gemini API key not configured")

        balances_str = json.dumps(balances, indent=2)
        transactions_str = json.dumps(transactions, indent=2)
        
        prompt = f"""
        Based on these net balances and suggested transactions, provide a friendly settlement suggestion.
        Net Balances: {balances_str}
        Suggested Transactions: {transactions_str}
        
        Provide a friendly suggestion on how to settle balances efficiently.
        """
        
        try:
            response = client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type='application/json',
                    response_schema=AISettlementSuggestion,
                ),
            )
            return response.parsed
        except Exception as e:
            raise Exception(f"AI Settlement Error: {str(e)}")
