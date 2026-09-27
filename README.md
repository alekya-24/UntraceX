# UntraceX — Document Inspection & Trace Sanitizer

UntraceX is a simple, clean, and professional document inspection and cleaning application. It analyzes documents for AI-related writing indicators and document metadata, provides analytical estimates, highlights detected patterns, allows users to select what to remove, improves text variation, and delivers genuine cleaned documents.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, React Router, Tailwind CSS, Lucide React
- **Backend**: Python, FastAPI, Uvicorn
- **Database**: SQLite (SQLAlchemy ORM)
- **Document Processing**:
  - `PyMuPDF` for PDF inspection & metadata purging
  - `python-docx` for DOCX core properties & extended app properties
  - `python-pptx` for PPTX slide properties & presentation metadata
  - Plain text analysis for TXT files
- **NLP / AI Analysis**: Statistical linguistic analysis (burstiness variance, cadence regularity, formulaic discourse markers, lexical predictability)
- **Text Improvement Engine**: Natural variation rewriting, cliché elimination, and diff generator

---

## 🚀 Running the Project

### 1. Backend (FastAPI)
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- SQLite Database: `backend/data/untracex.db`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://127.0.0.1:5173`

---

## 👤 Default Demo Credentials
- **Email**: `demo@untracex.local`
- **Password**: `demo1234`
*(Or click "Fill demo credentials" on the login screen, or register any new account)*

---

## 📋 The 4-Section Analysis Workflow

1. **AI Content Result**:
   - Estimated AI-Generated Content percentage & Human-Like Content percentage
   - Analytical indicators level: `LOW`, `MODERATE`, `ELEVATED`
   - Explicit disclaimer: *"This is an analytical estimate based on linguistic characteristics. It is not definitive proof of AI authorship."*

2. **AI-Related Text Highlights & AI Trace Panel**:
   - `RED` = High indicator
   - `YELLOW` = Moderate indicator
   - `NORMAL` = No significant indicator
   - Interactive trace panel displaying reasons: *Formulaic wording*, *High structural regularity*, *Repeated phrase pattern*
   - `[ IMPROVE SELECTED TEXT ]`: Rewrites formulaic passages to inject natural variation while preserving facts and terms

3. **Metadata Information & Removal**:
   - Real extracted file properties (Author, Created, Modified, Application, Company, Revision)
   - Marked with `🔴` to clearly distinguish detected metadata from visible content
   - Selective `[✓] Remove` checkboxes
   - `[ REMOVE SELECTED INFORMATION ]` button

4. **Before & After Cleaning**:
   - Desktop side-by-side comparison (BEFORE on left, AFTER on right)
   - Difference highlighting:
     - `RED`: Removed text
     - `GREEN`: Added text
     - `YELLOW`: Changed text
   - Metadata Before vs Metadata After comparison
   - `[ DOWNLOAD CLEANED FILE ]` (real generated file from backend)
   - `[ VIEW BEFORE ]` / `[ VIEW AFTER ]` toggles
