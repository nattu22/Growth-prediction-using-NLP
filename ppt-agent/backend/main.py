import boto3
import json
import os
import shutil
from enum import Enum
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
import uuid
from botocore.exceptions import ClientError, NoCredentialsError

app = FastAPI(title="PPT Agent Backend")

# Mount uploads directory to serve images
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

class LayoutType(str, Enum):
    COVER = "cover"
    THANK_YOU = "thank_you"
    SECTION_DIVIDER = "section_divider"
    SPLIT_DARK_LEFT = "split_dark_left"
    KPI_CARDS = "kpi_cards"
    LARGE_TEXT = "large_text"
    SMALL_SUMMARY = "small_summary"
    TABLE = "table"
    CHART = "chart"

class PromptRequest(BaseModel):
    prompt: str

class OutlineItem(BaseModel):
    title: str
    intent: str
    suggested_layout: LayoutType

class OutlineResponse(BaseModel):
    slides: List[OutlineItem]

class SlideGenerationRequest(BaseModel):
    title: str
    layout: LayoutType
    context: str # The original prompt or specific context for this slide
    template_id: Optional[str] = None

class SlideContent(BaseModel):
    title: str
    layout: LayoutType
    content: Dict[str, Any] # Flexible structure: {'bullets': [], 'stats': [{'label': 'x', 'val': 'y'}]}
    notes: Optional[str] = None
    template_url: Optional[str] = None

class TemplateResponse(BaseModel):
    template_id: str
    url: str

# --- Helpers ---

def get_bedrock_client():
    return boto3.client(service_name='bedrock-runtime', region_name='us-east-1')

def analyze_layout(title: str, intent: str, position: int, total: int) -> LayoutType:
    """
    Simple heuristic to suggest a layout.
    """
    intent_lower = intent.lower()
    title_lower = title.lower()

    if position == 0 or "intro" in intent_lower or "cover" in intent_lower:
        return LayoutType.COVER
    if position == total - 1 or "conclusion" in intent_lower or "thank" in intent_lower:
        return LayoutType.THANK_YOU
    if "section" in intent_lower or "divider" in intent_lower:
        return LayoutType.SECTION_DIVIDER
    if "split" in intent_lower or "detail" in intent_lower or "agenda" in intent_lower:
        return LayoutType.SPLIT_DARK_LEFT
    if "kpi" in intent_lower or "metric" in intent_lower or "number" in intent_lower or "stats" in intent_lower:
        return LayoutType.KPI_CARDS
    if "compare" in intent_lower or "table" in intent_lower or "schedule" in intent_lower or "pricing" in intent_lower:
        return LayoutType.TABLE
    if "trend" in intent_lower or "chart" in intent_lower or "growth" in intent_lower or "breakdown" in intent_lower or "graph" in intent_lower:
        return LayoutType.CHART
    if "summary" in intent_lower or "conclusion" in intent_lower:
        return LayoutType.SMALL_SUMMARY

    # Default fallback
    return LayoutType.LARGE_TEXT

def invoke_claude(system_prompt: str, user_message: str):
    try:
        client = get_bedrock_client()
        model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}]
        })

        response = client.invoke_model(
            body=body,
            modelId=model_id,
            accept='application/json',
            contentType='application/json'
        )

        response_body = json.loads(response.get('body').read())
        content_text = response_body['content'][0]['text']

        cleaned_text = content_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]

        return json.loads(cleaned_text.strip())

    except (ClientError, NoCredentialsError) as e:
        print(f"AWS Bedrock error (falling back to mock): {e}")
        return None
    except Exception as e:
        print(f"Unexpected error invoking Claude (falling back to mock): {e}")
        return None

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "PPT Agent Backend v2"}

@app.post("/upload-template", response_model=TemplateResponse)
async def upload_template(file: UploadFile = File(...)):
    # Sanitize filename and use UUID to prevent path traversal and collisions
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploads", safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return URL (assuming localhost for now, can be adapted)
    return TemplateResponse(
        template_id=safe_filename,
        url=f"http://localhost:8000/uploads/{safe_filename}"
    )

@app.post("/generate-outline", response_model=OutlineResponse)
def generate_outline(request: PromptRequest):
    system_prompt = """
    You are an expert presentation designer. Create a diverse presentation outline based on the topic.

    You MUST aim to use a variety of slide types in your outline.
    Suggested intents to include (where relevant):
    - "Introduction" (Cover)
    - "Section Divider" (to split topics)
    - "Key Metrics" or "Statistics" (for KPI Cards)
    - "Detailed Analysis" (Large Text)
    - "Comparison" or "Pricing" (Table)
    - "Trends" or "Growth" (Chart)
    - "Summary" (Small Summary)
    - "Closing" (Thank You)

    Return a JSON object with a key "slides" which is a list of objects.
    Each object must have:
    - "title": string
    - "intent": string (e.g., "Introduction", "Key Metrics", "Comparison", "Growth Trend", etc.)

    Ensure NO duplicate slide concepts. Keep it between 6-10 slides.
    """

    data = invoke_claude(system_prompt, f"Topic: {request.prompt}")

    if data is None:
        # Mock Response
        slides_data = [
            {"title": f"{request.prompt} - Overview", "intent": "Introduction"},
            {"title": "Key Metrics", "intent": "Financial KPIs"},
            {"title": "Market Trends", "intent": "Growth Trend Chart"},
            {"title": "Feature Comparison", "intent": "Product Table Comparison"},
            {"title": "Summary", "intent": "Quick comparison summary"},
            {"title": "Thank You", "intent": "Closing"}
        ]
    else:
        slides_data = data.get("slides", [])

    # Process layout analysis
    result_slides = []
    total = len(slides_data)
    for i, slide in enumerate(slides_data):
        layout = analyze_layout(slide['title'], slide['intent'], i, total)
        result_slides.append(OutlineItem(
            title=slide['title'],
            intent=slide['intent'],
            suggested_layout=layout
        ))

    return OutlineResponse(slides=result_slides)

@app.post("/generate-slide-content", response_model=SlideContent)
def generate_slide_content(request: SlideGenerationRequest):

    # Customize prompt based on layout
    if request.layout == LayoutType.KPI_CARDS:
        structure_hint = "Return JSON with 'kpis': [{'label': 'Revenue', 'value': '$10M', 'icon': 'dollar'}, ...]. Suggested icons: dollar, users, trend, chart, globe, alert, check."
    elif request.layout == LayoutType.TABLE:
        structure_hint = "Return JSON with 'table': {'columns': ['Col1', 'Col2'], 'rows': [['Row1Data1', 'Row1Data2'], ['Row2Data1', 'Row2Data2']]}. Keep it to 3-4 columns and 4-5 rows max."
    elif request.layout == LayoutType.CHART:
        structure_hint = "Return JSON with 'chart': {'type': 'bar', 'data': [{'label': 'Q1', 'value': 100}, {'label': 'Q2', 'value': 150}]}. Ensure values are numeric."
    elif request.layout == LayoutType.COVER:
         structure_hint = "Return JSON with 'subtitle': '...'"
    elif request.layout == LayoutType.SPLIT_DARK_LEFT:
        structure_hint = "Return JSON with 'subtitle': '...' and 'bullet_points': ['...']. This is a split slide with a dark header on left."
    else:
        structure_hint = "Return JSON with 'bullet_points': ['...']. Keep points concise (max 15 words each)."

    system_prompt = f"""
    Generate content for a slide with Title: "{request.title}" and Layout: "{request.layout}".
    Context: {request.context}.
    {structure_hint}
    Also include 'notes' key for speaker notes (max 50 words).
    """

    data = invoke_claude(system_prompt, "Generate content.")

    if data is None:
        # Mock Data based on layout
        if request.layout == LayoutType.KPI_CARDS:
            content = {"kpis": [{"label": "Metric 1", "value": "100", "icon": "check"}, {"label": "Metric 2", "value": "50%", "icon": "trend"}]}
        elif request.layout == LayoutType.TABLE:
             content = {"table": {"columns": ["Feature", "Plan A", "Plan B"], "rows": [["Users", "10", "Unlimited"], ["Storage", "10GB", "1TB"], ["Support", "Email", "24/7"]]}}
        elif request.layout == LayoutType.CHART:
             content = {"chart": {"type": "bar", "data": [{"label": "Jan", "value": 30}, {"label": "Feb", "value": 45}, {"label": "Mar", "value": 60}]}}
        elif request.layout == LayoutType.COVER:
            content = {"subtitle": "A Deep Dive"}
        else:
            content = {"bullet_points": ["Mock point 1", "Mock point 2"]}

        notes = "Mock notes."
    else:
        # Extract content excluding notes
        notes = data.pop("notes", "")
        content = data

    template_url = None
    if request.template_id:
        template_url = f"http://localhost:8000/uploads/{request.template_id}"

    return SlideContent(
        title=request.title,
        layout=request.layout,
        content=content,
        notes=notes,
        template_url=template_url
    )
