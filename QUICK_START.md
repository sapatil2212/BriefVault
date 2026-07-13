# BriefVault - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MySQL database running
- Gemini API key (or OpenRouter API key)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
# Copy .env file is already configured
# Verify these key settings:

DATABASE_URL="mysql://..."
GEMINI_API_KEY="AQ.Ab8..."  # ✅ Already configured
OPENROUTER_API_KEY="sk-or-v1-..."  # ✅ Available
AI_LLM_PROVIDER="gemini"  # ✅ Active
```

3. **Setup database:**
```bash
npx prisma db push
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open browser:**
```
http://localhost:3000
```

---

## 📊 Current Configuration

### AI Setup ✅
```env
Provider: Google Gemini
Model: gemini-2.5-flash
Embedding: gemini-embedding-001
Vector Store: Database (MySQL)
```

### Available Providers
- ✅ **Google Gemini** (Active)
- ✅ **OpenRouter** (Configured, ready to use)
- ✅ **OpenAI** (Config available)
- ✅ **Anthropic** (Config available)
- ✅ **Local/Ollama** (Config available)

### To Switch Providers
Just change in `.env`:
```env
# Switch to OpenRouter
AI_LLM_PROVIDER="openrouter"
AI_LLM_MODEL="google/gemini-2.5-flash"
# or
AI_LLM_MODEL="anthropic/claude-3.5-sonnet"
```

---

## 🎯 First Steps

### 1. Sign Up
- Navigate to: `http://localhost:3000/signup`
- Enter phone number
- Verify OTP
- Create account

### 2. Upload Document
- Go to: `http://localhost:3000/dashboard/upload`
- Drag & drop a text file or PDF
- Wait for processing
- View document analysis

### 3. Explore AI Features
- **Executive Summary** - Get overview
- **Key Highlights** - Extract important points
- **Case Law** - Find citations
- **Legal Research** - Ask questions (RAG)
- **Compare** - Compare two documents
- **Reports** - Generate comprehensive reports

---

## 🔍 Feature Walkthrough

### Dashboard Home
```
http://localhost:3000/dashboard
```
- View KPIs (documents, summaries, analyses)
- See recent documents
- Check processing trends
- Quick actions

### My Documents
```
http://localhost:3000/dashboard/documents
```
- Grid view of all documents
- Filter by status/type
- Search functionality
- Quick actions (view, edit, delete)

### Document Analysis
```
http://localhost:3000/dashboard/documents/[id]
```
**Available Analyses (19 modules):**

**Summaries:**
- Executive Summary
- One-Page Summary
- Quick Summary
- Key Highlights
- Timeline

**Litigation:**
- Case Facts
- Questions Before Court
- Arguments
- Final Decision
- Ratio Decidendi
- Obiter Dicta

**Compliance:**
- Risk Analysis
- Compliance Checklist
- Action Items
- Deadlines & Dates
- Monetary Information

**References:**
- Sections of Law
- Case Citations
- Important Paragraphs

### Legal Research (RAG Chat)
```
http://localhost:3000/dashboard/research
```
- Ask questions about your documents
- Get citation-backed answers
- Streaming responses
- Sources included

### Case Law Finder
```
http://localhost:3000/dashboard/case-law
```
- All cited judgments
- Documents identified as judgments
- Court, case number, judge info
- Quick navigation

### Public Data Explorer
```
http://localhost:3000/dashboard/public-data
```
- Search public acts
- Filter by type
- Sample data included
- Ready for API integration

---

## 🛠️ Common Tasks

### Upload and Process Document
```bash
# Via UI: /dashboard/upload
# Or via API:
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  -F "title=My Document"
```

### Generate Analysis
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "...",
    "kind": "KEY_HIGHLIGHTS"
  }'
```

### Ask Question (RAG)
```bash
curl -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the main arguments?",
    "documentIds": ["..."]
  }'
```

---

## 🎨 UI Customization

### Theme
- Toggle dark/light mode: Top-right menu
- Preference is saved per user

### Sidebar
- Collapse/expand: Bottom of sidebar (desktop)
- Mobile: Hamburger menu

### Font
- Currently using **Inter** (Google Fonts)
- Configured in: `src/app/layout.tsx`

---

## 🔧 Configuration Options

### AI Settings (`.env`)
```env
# LLM Configuration
AI_LLM_PROVIDER="gemini"          # Provider selection
AI_LLM_MODEL="gemini-2.5-flash"   # Model selection
AI_MAX_CONTEXT_CHUNKS="8"         # Context window
AI_MIN_CONFIDENCE="0.3"           # Confidence threshold
AI_REQUEST_TIMEOUT_MS="60000"     # 60 second timeout

# Embedding Configuration
AI_EMBEDDING_PROVIDER="gemini"
AI_EMBEDDING_MODEL="gemini-embedding-001"
AI_EMBEDDING_DIMENSIONS="768"

# Vector Store
AI_VECTOR_STORE="db"              # or "pinecone" | "qdrant"
```

### Storage Settings
```env
STORAGE_PROVIDER="local"          # or "s3" | "r2" | "minio"
STORAGE_ROOT="/var/www/storage"
MAX_FILE_SIZE="104857600"         # 100MB
```

### Authentication
```env
OTP_TTL_MINUTES=5
OTP_MAX_ATTEMPTS=5
SESSION_TTL_DAYS=7
SESSION_TTL_DAYS_REMEMBER=30
```

---

## 📝 Sample Workflows

### Workflow 1: Analyze Legal Document
1. Go to **Upload Document**
2. Upload PDF/text file
3. Wait for processing (UPLOADED → PROCESSING → READY)
4. Click on document card
5. Click "Generate" on any analysis module
6. View results with citations
7. Export or save insights

### Workflow 2: Research Across Documents
1. Upload multiple documents
2. Go to **Legal Research**
3. Type your question
4. Get citation-backed answer
5. Click citations to view sources
6. Continue conversation

### Workflow 3: Generate Report
1. Open processed document
2. Generate multiple analyses
3. Go to **Reports**
4. Click "Generate Report"
5. Select analyses to include
6. View/download report

### Workflow 4: Compare Documents
1. Go to **Compare**
2. Select two documents
3. View side-by-side comparison
4. See highlighted differences
5. Export comparison

---

## 🚨 Troubleshooting

### Database Connection Error
```bash
# Check DATABASE_URL in .env
# Verify MySQL is running
# Test connection:
npx prisma db pull
```

### API Key Error
```bash
# Verify GEMINI_API_KEY in .env
# Or switch to OpenRouter:
AI_LLM_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk-or-v1-..."
```

### Document Processing Stuck
```bash
# Check processing jobs:
# Go to: /api/documents/:id/status
# Look for error messages
# Retry processing if needed
```

### Build Error
```bash
# Clear Next.js cache:
rm -rf .next
npm run build

# Check for TypeScript errors:
npx tsc --noEmit
```

---

## 📚 API Documentation

### Document APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/upload` | POST | Upload file |
| `/api/documents/process` | POST | Create from text |
| `/api/documents` | GET | List documents |
| `/api/documents/:id/status` | GET | Processing status |
| `/api/documents/:id/results` | GET | Get results |
| `/api/documents/:id` | DELETE | Soft delete |

### AI APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/summarize` | POST | Executive summary |
| `/api/ai/analyze` | POST | Run analysis |
| `/api/ai/ask` | POST | RAG question |
| `/api/ai/ask/stream` | POST | Streaming chat |
| `/api/ai/compare` | POST | Compare docs |

---

## 🎓 Learning Resources

### Documentation
- `AI_ENGINE.md` - AI architecture
- `AUTH.md` - Authentication system
- `IMPLEMENTATION_STATUS.md` - Feature status
- `SIDEBAR_MENU_STATUS.md` - Navigation guide
- `PROJECT_SUMMARY.md` - Complete overview

### Code Examples
- `src/lib/ai/analysis/registry.ts` - Analysis modules
- `src/lib/ai/providers/llm/` - LLM implementations
- `src/components/dashboard/` - UI components
- `src/app/api/` - API route handlers

---

## ✅ Health Check

Run this to verify your setup:

```bash
# 1. Check Node version (should be 18+)
node --version

# 2. Check database connection
npx prisma db pull

# 3. Check environment variables
npm run check-env  # If script exists

# 4. Build project
npm run build

# 5. Start dev server
npm run dev
```

If all steps pass, you're ready to go! 🚀

---

## 🔗 Quick Links

- **Local:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **Upload:** http://localhost:3000/dashboard/upload
- **Research:** http://localhost:3000/dashboard/research
- **Docs:** http://localhost:3000/dashboard/documents

---

## 💡 Tips & Best Practices

### Performance
- Process documents async (don't use `sync: true`)
- Use pagination for large document lists
- Cache frequently accessed data
- Optimize image sizes

### AI Usage
- Start with Gemini (most cost-effective)
- Use OpenRouter for multi-model testing
- Monitor API costs in logs
- Set confidence thresholds appropriately

### Security
- Keep API keys in `.env` (never commit)
- Use strong session secrets
- Enable rate limiting in production
- Regular security audits

### Development
- Use TypeScript strictly
- Follow component structure
- Write meaningful commit messages
- Test before deploying

---

**Need help?** Check the documentation files or review the code examples.

**Ready to deploy?** See `PROJECT_SUMMARY.md` for deployment checklist.

---

*Happy building! 🚀*
