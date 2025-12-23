from fastapi.testclient import TestClient
from main import app
import os
import json
from unittest.mock import MagicMock, patch

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to PPT Agent API"}

@patch("main.get_bedrock_client")
def test_generate_slide_mock(mock_get_bedrock_client):
    # Mocking Bedrock response
    mock_bedrock = MagicMock()
    mock_get_bedrock_client.return_value = mock_bedrock

    # Mock the invoke_model response
    # It returns a streaming body typically, but here we mocked boto3 client
    # so we need to mock what response['body'].read() returns.

    mock_response_body = {
        "content": [
            {
                "text": json.dumps({
                    "title": "Mock Title",
                    "bullet_points": ["Point A", "Point B"],
                    "notes": "Mock Notes"
                })
            }
        ]
    }

    mock_body_stream = MagicMock()
    mock_body_stream.read.return_value = json.dumps(mock_response_body).encode('utf-8')

    mock_bedrock.invoke_model.return_value = {
        'body': mock_body_stream
    }

    # We also need to set env vars to ensure we don't hit the fallback path immediately
    # or we can test the fallback path.
    # Let's test the happy path by simulating env vars.
    with patch.dict(os.environ, {"AWS_ACCESS_KEY_ID": "testing", "AWS_PROFILE": "testing"}):
        response = client.post("/generate-slide", json={"prompt": "test prompt"})

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Mock Title"
    assert len(data["bullet_points"]) == 2
    assert data["notes"] == "Mock Notes"

def test_generate_slide_fallback():
    # Test fallback when no creds (which is true in this environment usually)
    # Ensure env vars are cleared for this test
    with patch.dict(os.environ, {}, clear=True):
        response = client.post("/generate-slide", json={"prompt": "fallback prompt"})

    assert response.status_code == 200
    data = response.json()
    # Check if it returns the fallback response
    assert data["title"].startswith("Presentation about: fallback prompt")
