from fastapi.testclient import TestClient
from main import app
import os
import json
from unittest.mock import MagicMock, patch

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "PPT Agent Backend v2"}

def test_generate_outline_fallback():
    # Test fallback when no creds
    with patch.dict(os.environ, {}, clear=True):
        response = client.post("/generate-outline", json={"prompt": "fallback prompt"})

    assert response.status_code == 200
    data = response.json()
    assert "slides" in data
    assert len(data["slides"]) > 0
    # Check if layout analysis worked
    assert "suggested_layout" in data["slides"][0]

def test_generate_slide_content_fallback():
    with patch.dict(os.environ, {}, clear=True):
        response = client.post("/generate-slide-content", json={
            "title": "Test Slide",
            "layout": "large_text",
            "context": "Context"
        })

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Slide"
    assert data["layout"] == "large_text"
    assert "content" in data

@patch("main.get_bedrock_client")
def test_generate_outline_mock(mock_get_bedrock_client):
    mock_bedrock = MagicMock()
    mock_get_bedrock_client.return_value = mock_bedrock

    mock_response_body = {
        "content": [
            {
                "text": json.dumps({
                    "slides": [
                         {"title": "Intro", "intent": "Introduction"},
                         {"title": "Stats", "intent": "Key Metrics"}
                    ]
                })
            }
        ]
    }

    mock_body_stream = MagicMock()
    mock_body_stream.read.return_value = json.dumps(mock_response_body).encode('utf-8')
    mock_bedrock.invoke_model.return_value = {'body': mock_body_stream}

    with patch.dict(os.environ, {"AWS_ACCESS_KEY_ID": "test"}):
        response = client.post("/generate-outline", json={"prompt": "Test"})

    assert response.status_code == 200
    data = response.json()
    assert len(data["slides"]) == 2
    assert data["slides"][0]["suggested_layout"] == "cover" # Heuristic check
    # Note: Logic says if position == total-1 (1 in this case), it's thank_you
    # so we expect thank_you here because total is 2 and index 1 is last.
    assert data["slides"][1]["suggested_layout"] == "thank_you"
