# PPT Agent

A production-grade presentation generator powered by AWS Bedrock (Claude) and React.

## Project Structure

- `backend/`: FastAPI Python application.
- `frontend/`: React + Vite application.

## Prerequisites

- Python 3.8+
- Node.js 18+
- AWS Credentials (for Bedrock access)

## Setup

### Backend

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   Server runs on `http://localhost:8000`.

### Frontend

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   App runs on `http://localhost:5173`.

## Environment Variables

### Backend
AWS credentials are automatically loaded by `boto3` from your environment or `~/.aws/credentials`.
Ensure you have access to `anthropic.claude-3-sonnet-20240229-v1:0` in `us-east-1`.

### Frontend
Create `.env` in `frontend/` if needed to override API URL:
```
VITE_API_URL=http://localhost:8000
```
