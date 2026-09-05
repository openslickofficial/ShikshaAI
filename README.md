# Shiksha AI — Intelligent Adaptive Learning Platform

> **Live Demo URL**: `[LIVE DEMO URL — TO BE ADDED]`  
> **Repository Root Documentation**: Built strictly against the live, verified codebase.

---

## Table of Contents
1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Key Features](#3-key-features)
4. [System Architecture](#4-system-architecture)
5. [AI/ML Models Used](#5-aiml-models-used)
6. [RAG Implementation](#6-rag-implementation)
7. [Prompt/Agent Architecture](#7-promptagent-architecture)
8. [Personalization Approach](#8-personalization-approach)
9. [Assessment Methodology](#9-assessment-methodology)
10. [Multilingual Implementation](#10-multilingual-implementation)
11. [Voice Implementation](#11-voice-implementation)
12. [Avatar/Video Generation Approach](#12-avatarvideo-generation-approach)
13. [APIs & Third-Party Services](#13-apis--third-party-services)
14. [Setup Instructions](#14-setup-instructions)
15. [Deployment Instructions](#15-deployment-instructions)
16. [Known Limitations](#16-known-limitations)

---

## 1. Problem Statement
Online education platforms predominantly deliver static, one-size-fits-all video recordings and uniform reading materials that fail to accommodate individual learner paces, prior misconceptions, and time constraints. When students struggle with complex concepts, traditional platforms offer no adaptive remediation, real-time comprehension verification, or multimodal reinforcement tailored to the student's learning profile.

---

## 2. Solution Overview
Shiksha AI is an autonomous educational engine that transforms any topic or uploaded document (PDF, DOCX, PPTX) into a fully structured, multi-section interactive lesson. The platform dynamically generates speakable narration scripts, mathematical formulas, synchronized slide visuals, natural voice audio, and presenter video avatars. As learners progress through interactive delivery, the system poses socratic checkpoint questions, diagnoses conceptual misconceptions, triggers targeted one-round re-explanations, persists learning histories to a relational database, and feeds diagnosed weak concepts back into future lesson planning.

---

## 3. Key Features
- **Dual-Mode Lesson Ingestion**: Generates lessons either from a raw topic prompt or from uploaded courseware files (`.pdf`, `.docx`, `.pptx`) using local vector RAG.
- **Strictly Structured Lesson Plans**: Generates multi-section pedagogical curricula with distinct depths (`intro`, `core`, `advanced`), explicit timing allocations, and grounded document citations.
- **Multimodal Section Delivery**: Produces speakable narration beats, on-screen headline callouts, structured bullet points, LaTeX math equations, and dynamic Mermaid diagrams per section.
- **Socratic Comprehension Checkpoints**: Generates concept-specific multiple-choice and open-ended verification questions at section boundaries.
- **Adaptive Misconception Remediation**: Diagnoses student answer errors and executes a 1-round alternative explanation using completely different pedagogical analogies.
- **Multilingual Synthesis**: Full end-to-end curriculum generation across 5 selectable languages (English, Hindi, Hinglish, Spanish, French) with Indic TTS voice support.
- **Cost & Quota Safeguards**: Hard character-budget ceilings for voice synthesis and duration-budget ceilings for avatar video rendering, backed by zero-cost mock fallbacks.
- **Enterprise Access Control**: Supabase Auth JWKS cryptographic token verification with multi-tenant session isolation and Upstash Redis sliding-window rate limiting.

---

## 4. System Architecture
The platform operates as a multi-stage linear and feedback pipeline:

1. **Input & Ingestion**: The learner supplies a subject topic or uploads a source document alongside difficulty, time, language, and teaching style preferences.
2. **RAG Vector Processing**: Uploaded documents are parsed in-memory, chunked with overlap, embedded via SentenceTransformers, and indexed into a local ChromaDB collection.
3. **Lesson Planning Agent**: An LLM agent analyzes the topic, preferences, prior weak concepts, and retrieved document chunks to produce a structured `LessonPlan` schema.
4. **Content Generation Engine**: An ensemble combines Groq Cloud's fast LPU storytelling analogies with Gemini's structured schema generation to produce narration scripts, slide text, and visual diagrams for all sections in a single call.
5. **Voice & Avatar Rendering**: Section narration is synthesized into audio via Sarvam AI (or ElevenLabs/mock), stitched, and passed to D-ID (or local FFmpeg) to compose synchronized video clips.
6. **Interactive Delivery**: A React player walks the student through audio narration, synchronized visual reveals, and formula rendering section by section.
7. **Formative Assessment**: The learner responds to comprehension checkpoints via text or voice recording (transcribed via Whisper/mock STT).
8. **Adaptive Remediation**: If an answer is incorrect, the evaluator diagnoses the underlying misconception and renders an immediate adaptive re-explanation.
9. **Learner Profile & Persistence**: Upon lesson completion, a deterministic score is calculated and saved alongside diagnosed weak concepts to Supabase Postgres to steer future sessions.

---

## 5. AI/ML Models Used
Every model identifier in the platform is verified directly against active configuration files:

- **Core Structured LLM**: `gemini-2.5-flash` (`settings.GEMINI_MODEL` in `app/core/config.py`).
- **LLM Fallback Rotation**: `["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"]` (`FALLBACK_MODELS` in `app/services/llm_client.py`).
- **Creative Analogy Engine**: `groq/compound` (`settings.GROQ_MODEL` in `app/core/config.py` via Groq Cloud REST API).
- **Text-to-Speech (TTS)**: `bulbul:v3` model, speaker `ritu` (`settings.SARVAM_TTS_MODEL` in `app/core/config.py` via Sarvam AI API).
- **Auxiliary TTS**: `eleven_multilingual_v2` (`settings.ELEVENLABS_MODEL` in `app/core/config.py` via ElevenLabs API).
- **Avatar Video Synthesis**: D-ID Presenter Video Engine (`/talks` API in `app/services/avatar_provider.py`).
- **Local Video Fallback**: H.264 video rendering with animated audio waveform overlay via FFmpeg (`imageio-ffmpeg`).
- **Embeddings**: `gemini-embedding-001` (768-dimensional dense vectors via Google Gemini hosted embedding API).
- **Speech-to-Text (STT)**: `base` PyTorch model (`settings.WHISPER_MODEL` in `app/core/config.py` via `openai-whisper`), with `MockSTTProvider` as the zero-dependency default.

---

## 6. RAG Implementation
- **File Parsing**: In-memory parsing using `pdfplumber` for PDF pages, `python-docx` for Word documents, and `python-pptx` for PowerPoint slide decks (`app/services/document_parser.py`).
- **Chunking Strategy**: Fixed-character sliding window of `600` characters (`TARGET_CHUNK_SIZE = 600`) with a `100`-character overlap (`CHUNK_OVERLAP = 100`) in `app/services/chunker.py`. Chunks attempt to break at sentence periods or newlines within a 150-character boundary zone.
- **Embedding Generation**: Hosted batch embedding via Google Gemini API (`gemini-embedding-001`, 768 dimensions), fully eliminating local PyTorch inference to prevent free-tier OOM crashes on Render.
- **Vector Storage**: Local persistent ChromaDB instance (`chromadb.PersistentClient`) storing document chunks and vectors under `backend/data/chroma`.
- **Query & Sampling**: When additional query notes are provided, retrieval uses cosine similarity (`query_similar`, top-6 chunks). When no notes are provided, retrieval evenly samples 6 chunks across the document index (`sample_spread`).
- **Learner Isolation**: Document chunks in ChromaDB and ephemeral stores are tagged with `learnerId`, preventing cross-learner document leakage.
- **Known Limitation**: Chunking relies on character length boundaries rather than semantic markdown or structural AST hierarchy (cross-referenced in Section 16).

---

## 7. Prompt/Agent Architecture
- **Structured Pydantic Validation**: All LLM calls pass through `generate_structured()` in `app/services/structured_llm.py`. Output is parsed into strict Pydantic models with JSON schema enforcement.
- **Self-Correction Retry Pattern**: If Gemini produces malformed JSON or schema validation fails, `generate_structured()` catches the exception and executes an automatic one-time retry with a corrective instruction prompt containing the schema requirements.
- **Candidate Model Rotation**: If a Gemini model returns a 404 (model unavailable) or 429 (quota limit), `llm_client.py` pauses for 3 seconds and falls back through candidate models sequentially.
- **Hybrid LLM Ensemble (Groq + Gemini)**: During study content generation (`app/services/content_generator.py`), Groq Cloud LPU (`groq/compound`) is invoked first to produce concise, creative real-world analogies. These analogies are injected directly into Gemini's prompt context before Gemini synthesizes the final structured narration beats, formulas, and visual diagrams. If Groq is unavailable, the pipeline falls back gracefully to Gemini alone.
- **Single-Call Curriculum Synthesis**: Narration scripts, on-screen text, visual specs, and formula tags for all sections in a lesson are generated in a single consolidated LLM invocation to maintain narrative continuity and avoid per-section token overhead.

---

## 8. Personalization Approach
Lessons adapt dynamically across 5 dimensions captured in `LessonRequest`:
- **Difficulty Level**: `beginner` (foundational analogies), `intermediate` (standard technical balance), or `advanced` (rigorous derivations and edge cases).
- **Time Constraints**: `5min` (2 compact intro sections), `20min` (3–4 structured sections), `60min` (5–6 comprehensive sections), or `7day` (7 daily revision modules).
- **Teaching Style**: `simple-examples` (analogy-first), `technical-detailed` (formal definitions and proofs), or `exam-focused` (high-yield criteria and problem-solving steps).
- **Language**: English, Hindi, Hinglish, Spanish, or French.
- **Prior Weak Concepts Feedback Loop**: During lesson creation, the system inspects the learner's historical assessment records in Supabase Postgres. Any previously diagnosed misconceptions or failed concepts are passed to `priorWeakConcepts` in `lesson_planner.py`. The planning prompt explicitly commands the LLM: *"This learner has previously struggled with: [concepts]. If any of these concepts are relevant to this topic, include extra reinforcement or a dedicated section for them."*

---

## 9. Assessment Methodology
- **Checkpoint Generation**: Each section with `hasCheckpoint: true` receives an assessment item generated by `app/services/checkpoint_generator.py`. The LLM generates the question, 4 multiple-choice options (or an open-ended prompt), the correct answer, and an evaluation rubric.
- **Misconception Diagnosis**: In `app/services/answer_evaluator.py`, student responses are graded against the rubric and classified as `correct`, `partial`, or `incorrect`. If incorrect, the engine diagnoses the exact misunderstanding (e.g. *"Confused gradient direction with magnitude"*).
- **Adaptive 1-Round Remediation**: When an answer is incorrect, the engine invokes `generate_remediation()` to produce a fresh, alternative explanation using a completely different pedagogical angle (e.g., transitioning from a formal mathematical rule to an intuitive physical analogy). To prevent student frustration and infinite loops, remediation is strictly capped at one round per checkpoint.
- **Deterministic Scoring**: Unlike platforms that let LLMs invent scores, overall lesson scores in `app/services/report_generator.py` are computed using deterministic Python math:
  $$\text{Score} = \left(\frac{\sum \text{points}}{\text{total checkpoints}}\right) \times 100$$
  where $\text{correct} = 1.0$, $\text{partial} = 0.5$, and $\text{incorrect} = 0.0$. The resulting score is locked into the final report and cannot be altered by LLM hallucination.

---

## 10. Multilingual Implementation
- **Supported Languages**: The frontend language picker (`PreferencesStep.tsx`) allows users to select from 5 language modes:
  1. `English`
  2. `Hindi` (Devanagari script)
  3. `Hinglish` (Colloquial Hindi written in Latin script)
  4. `Spanish`
  5. `French`
- **Prompt Enforcement**: The selected language is propagated through `LessonRequest.language` into planning and content generation prompts. The system instructions explicitly enforce: *"Keep concept titles, narration beats, on-screen text, and headlines strictly in the requested language."*
- **Speech Synthesis Support**: When Sarvam AI is active, language codes are mapped to regional Indian voice endpoints (e.g. `hi-IN` for Hindi). Non-Indic languages and mock mode utilize universal MP3/WAV generation.

---

## 11. Voice Implementation
- **Active TTS Provider**: Configured via `settings.TTS_PROVIDER` in `app/core/config.py`. Defaults to `sarvam` when `SARVAM_API_KEY` is present; falls back cleanly to `mock`.
- **Character Budget Mechanism**: `app/services/character_budget.py` maintains persistent character spend tracking in `backend/data/tts_usage.json`. Before synthesizing audio, `reserve_budget()` checks requested character counts against `MAX_TTS_CHARACTERS` (default `9000`). If exceeded, it raises `BudgetExceededError` (`402 Payment Required`), protecting against unbudgeted cloud API bills.
- **Mock TTS Fallback**: `MockTTSProvider` programmatically synthesizes valid MPEG-1 Layer III (MP3) frames directly in Python bytes without external network dependencies. It calculates clip lengths based on character duration (~14 characters per second of speech), allowing full UI and audio player testing at zero cost.

---

## 12. Avatar/Video Generation Approach
- **Presenter Video Pipeline**: Handled via `app/services/avatar_provider.py` and `app/services/video_composer.py`.
- **D-ID Integration**: When `AVATAR_PROVIDER="did"`, audio narration is submitted to D-ID's `/talks` API. The backend polls the talk status until rendering completes, downloads the resulting MP4, and burns an on-screen headline banner onto the bottom of the video frame using FFmpeg's `drawtext` filter.
- **Duration Budget Mechanism**: Video usage is tracked in `backend/data/video_usage.json`. New avatar generation requests check duration against `MAX_AVATAR_SECONDS` (default `150` seconds). Requests exceeding the ceiling are rejected with HTTP 402.
- **Mock Avatar Fallback**: `MockAvatarProvider` uses `imageio-ffmpeg` to compose an H.264 MP4 video locally. It visualizes an animated golden audio waveform synchronized to narration audio with burned-in section headlines, providing a zero-cost fallback that requires no external API keys.

---

## 13. APIs & Third-Party Services

| Service | Category | Role in Architecture | Required / Optional |
|---|---|---|:---:|
| **Google Gemini API** | LLM Core | Primary generator for structured lesson plans, section content scripts, checkpoint items, answer evaluation, and final reports. | **Required** |
| **Groq Cloud LPU** | LLM Auxiliary | High-speed creative analogy and storytelling engine. Enriches content generation prompts before Gemini synthesis; falls back gracefully if unconfigured. | Optional |
| **Sarvam AI** | Speech Synthesis | Production text-to-speech engine (`bulbul:v3`) supporting Indian languages and clear bilingual delivery. | Optional (Mock fallback) |
| **D-ID Studio** | Video Avatar | Lip-synced talking presenter avatar video synthesis (`/talks`). | Optional (Mock fallback) |
| **ElevenLabs** | Speech Synthesis | Secondary high-fidelity multilingual voice engine. | Optional |
| **Supabase Auth** | Access Control | User registration, login, and RS256/ES256 JWKS public key token verification. | **Required** |
| **Supabase Postgres** | Relational Database | Persistent storage for `LearnerProfile`, `LessonSession`, and `CheckpointRecord` models via SQLModel connection pool. | **Required** (or local SQLite) |
| **Upstash Redis** | Rate Limiting | Distributed REST-based sliding window rate limiter enforcing 10 req/hr/IP across expensive AI endpoints. | Optional (Pass-through fallback) |

---

## 14. Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and supply your `GEMINI_API_KEY`, `SUPABASE_URL`, and `DATABASE_URL`. Optional keys (`GROQ_API_KEY`, `SARVAM_API_KEY`, `DID_API_KEY`) can be added if available; otherwise the system operates safely using mock providers.
5. Start the backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Verify backend health at `http://127.0.0.1:8000/api/health`.

### Frontend Setup
1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Ensure `.env` contains:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 15. Deployment Instructions

### Backend Deployment (Render)
1. Create a new **Web Service** on Render connected to your repository.
2. Set the **Root Directory** to `backend`.
3. Set the **Runtime** to `Python 3`.
4. Set the **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
5. Set the **Start Command**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. Add the required Environment Variables in the Render dashboard:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `DATABASE_URL`
   - `ALLOWED_ORIGINS` (Set initially to `http://localhost:5173`)
   - `ALLOW_UNVERIFIED_AUTH_FALLBACK` = `false`
   - *(Optional)*: `GROQ_API_KEY`, `SARVAM_API_KEY`, `DID_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
7. Once deployed, note your public Render URL (e.g. `https://ai-teacher-backend.onrender.com`).

### Frontend Deployment (Vercel)
1. Create a new project on Vercel connected to your repository.
2. Set the **Root Directory** to `frontend`.
3. Set the **Framework Preset** to `Vite`.
4. Configure the Environment Variables:
   - `VITE_API_BASE_URL` = `https://ai-teacher-backend.onrender.com` (your Render backend URL)
   - `VITE_SUPABASE_URL` = `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-supabase-anon-key`
5. Deploy the project. Note your public Vercel URL (e.g. `https://ai-teacher.vercel.app`).
6. **Post-Deployment Origin Sync**: Return to Render -> Environment Variables -> update `ALLOWED_ORIGINS` to include your Vercel URL:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,https://ai-teacher.vercel.app
   ```

---

## 16. Known Limitations
1. **Ephemeral Disk on Free-Tier Hosting**: When hosted on Render's free tier, the container filesystem is ephemeral. While relational data (`LearnerProfile`, `LessonSession`, `CheckpointRecord`) persists permanently in Supabase Postgres, local vector indices in `backend/data/chroma` and generated audio/video files in `backend/data/` reset when the server spins down or redeploys.
2. **Free-Tier Cloud Budgets**: Production voice (Sarvam/ElevenLabs) and video (D-ID) generation are hard-capped by character and duration ceilings. For open evaluation, mock providers serve as the default zero-cost fallback.
3. **Single-Round Remediation Cap**: Adaptive remediation is deliberately limited to one pedagogical re-explanation round per checkpoint. If a student answers incorrectly a second time, the player offers constructive feedback and advances to avoid deadlocks.
4. **Fixed-Character RAG Chunking**: Document chunking splits text into 600-character windows with 100-character overlap. It does not parse semantic document trees, section headings, or table boundaries.
5. **Authentication Scope**: Supabase Auth supports email/password authentication. Third-party OAuth (Google, GitHub) and self-service password recovery workflows are not wired in the current interface.
6. **Database Authorization Boundaries**: Row Level Security (RLS) policies are omitted in Supabase Postgres because the frontend never connects directly to the database. All multi-tenant data access control is enforced at the FastAPI service layer.
7. **Synchronous Avatar Generation Latency**: Real-time D-ID video synthesis requires video rendering and polling, introducing a 15–30 second latency per section.
8. **Client-Exposed Checkpoint Rubrics**: Multiple-choice answers and grading rubrics are transmitted to the frontend client payload within the session structure. While suitable for formative self-paced practice, it is not hardened for high-stakes exam proctoring.
