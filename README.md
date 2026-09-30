# Proposal Agent — AI Proposal & Tender Preparation System

Enterprise AI system engineered for professional services (e.g. ACNABIN Chartered Accountants) to automate end-to-end tender analysis, requirement extraction, evidence matching, and proposal generation.

## 📖 Comprehensive Documentation
For the complete architectural breakdown, AI routing matrix, ingestion pipeline, anti-hallucination protocols, and API reference, please see:
👉 **[PROPOSAL_AGENT_GUIDE.md](file:///d:/Proposal%20Agent/PROPOSAL_AGENT_GUIDE.md)**

---

## ⚡ Quick Start

### 1. Environment Setup
Create or update your `.env` in the root directory:
```ini
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
CLOUDFLARE_ACCOUNT_ID=your_cf_account_id
CLOUDFLARE_API_TOKEN=your_cf_api_token
```

### 2. Run Backend & Frontend
Run the one-click startup script:
```cmd
start.bat
```
Or start manually:
```bash
# Terminal 1: Backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
