import boto3
import json
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(title="PPT Agent Backend")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bedrock Client Setup
# Ensure AWS credentials are in environment variables or ~/.aws/credentials
def get_bedrock_client():
    # In a real scenario, you might assume credentials are loaded via env vars or IAM roles.
    # We return the client. If region is needed, specify it.
    return boto3.client(service_name='bedrock-runtime', region_name='us-east-1')

class PromptRequest(BaseModel):
    prompt: str

class SlideContent(BaseModel):
    title: str
    bullet_points: list[str]
    notes: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to PPT Agent API"}

@app.post("/generate-slide", response_model=SlideContent)
def generate_slide(request: PromptRequest):
    try:
        # Mock response if credentials are not set (for safety in this environment if needed)
        # But we will try to use Bedrock.
        if not os.environ.get("AWS_ACCESS_KEY_ID") and not os.environ.get("AWS_PROFILE"):
             # Fallback for demo/test purposes if no AWS creds
             return SlideContent(
                 title=f"Presentation about: {request.prompt}",
                 bullet_points=["Point 1: Key insight", "Point 2: Supporting data", "Point 3: Conclusion"],
                 notes="These are generated mock notes."
             )

        client = get_bedrock_client()

        # Bedrock Claude 3 model ID (example) or Claude 2
        model_id = "anthropic.claude-3-sonnet-20240229-v1:0" # Example model ID

        # Prompt for Claude
        system_prompt = "You are an AI presentation assistant. Generate a single slide content based on the user prompt. Return valid JSON only with keys: 'title', 'bullet_points' (list of strings), and 'notes'."
        user_message = f"Create a slide for: {request.prompt}"

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        })

        response = client.invoke_model(
            body=body,
            modelId=model_id,
            accept='application/json',
            contentType='application/json'
        )

        response_body = json.loads(response.get('body').read())
        content_text = response_body['content'][0]['text']

        # Parse JSON from content_text
        # Claude might wrap in ```json ... ``` sometimes, need to handle that
        cleaned_text = content_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]

        data = json.loads(cleaned_text.strip())

        return SlideContent(
            title=data.get("title", "Untitled"),
            bullet_points=data.get("bullet_points", []),
            notes=data.get("notes", "")
        )

    except Exception as e:
        # In case of error (e.g. Bedrock not accessible), mock or raise
        print(f"Error calling Bedrock: {e}")
        # Fallback for now to ensure UI works even if AWS fails
        return SlideContent(
                 title=f"Error/Fallback: {request.prompt}",
                 bullet_points=["Could not connect to Bedrock or parse response.", str(e)],
                 notes="Check backend logs."
             )
