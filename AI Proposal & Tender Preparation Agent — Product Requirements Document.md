# AI Proposal & Tender Preparation Agent

## 1. Product Overview

### 1.1 Product Name

**AI Proposal & Tender Preparation Agent**

### 1.2 Purpose

Build an AI-assisted proposal and tender preparation platform that can receive a TOR, RFP, RFQ, EOI, tender document, or similar procurement document; automatically process and OCR the documents; identify all requirements; search the organization's permanent knowledge base for relevant company information, CVs, experience and previous proposals; recommend the best supporting materials; generate technical and financial proposals; populate prescribed forms; modify existing PPTX proposals where required; perform a final compliance review; and produce a clean submission-ready package.

The system is intended for professional consulting, audit, advisory, technology, ESG, financial, management, forensic, and similar proposal/tender work.

The system must operate as a **human-in-the-loop AI assistant**, not as an autonomous decision-maker.

---

# 2. Core Objectives

The system shall:

1. Reduce manual effort in analyzing TOR/RFP/RFQ/EOI documents.
2. Automatically process searchable and scanned documents.
3. Perform OCR/document extraction before AI analysis.
4. Identify mandatory and non-mandatory requirements.
5. Create a structured requirement and compliance matrix.
6. Search permanent organizational knowledge automatically.
7. Match previous assignments and experts to the current requirement.
8. Recommend the strongest evidence for each requirement.
9. Analyze previous proposals to understand the organization's writing and presentation style.
10. Offer 2–3 proposal style/structure options based on actual previous proposals.
11. Generate technical proposals.
12. Generate financial proposals without inventing financial figures.
13. Populate prescribed forms and annexures.
14. Preserve existing client-provided templates whenever required.
15. Modify existing PPTX proposals only where changes are necessary.
16. Preserve existing PPTX design, theme, formatting, images and structure wherever possible.
17. Maintain source traceability for important facts and claims.
18. Require human approval at critical stages.
19. Perform a final compliance check.
20. Generate a clean submission folder and ZIP package.
21. Maintain project history and proposal versions.
22. Protect confidential organizational and client information.

---

# 3. Design Principles

The application must follow these principles:

### 3.1 Original Files Are Never Overwritten

Uploaded source files must always remain unchanged.

Generated files must be stored separately.

### 3.2 AI Does Not Invent Facts

The system must not fabricate:

- company experience
- client names
- project values
- dates
- employee qualifications
- certifications
- registration numbers
- TIN/BIN
- financial figures
- references
- signatures
- legal information
- proposal requirements

If information is unavailable, the system must mark it as:

**MISSING / USER INPUT REQUIRED**

### 3.3 Human-in-the-Loop

AI recommendations are recommendations.

The user must be able to approve, reject, edit or replace AI selections.

### 3.4 Evidence-Based Generation

Important claims should be traceable to their source.

Example:

> Similar assignment experience identified.

Source:

`Experience Certificate - XYZ.pdf — Page 4`

### 3.5 Modular AI

Do not create one enormous AI prompt that performs the entire proposal process.

Use separate AI tasks/modules for:

- document analysis
- requirement extraction
- matching
- drafting
- reviewing
- compliance
- PPTX change planning

### 3.6 Provider Independence

The application must support multiple AI providers.

Primary:

**Gemini**

Secondary:

**DeepSeek**

AI providers must be configurable rather than hard-coded throughout the application.

---

# 4. Technology Architecture

## 4.1 Recommended Stack

### Frontend

- HTML
- CSS
- JavaScript/TypeScript
- Responsive web UI

### Backend

- Node.js
- TypeScript

### AI

- Gemini API
- DeepSeek API

### Document Processing

- Microsoft MarkItDown
- OCR engine
- Python document-processing service where required

### Database

- Supabase PostgreSQL

### File Storage

- Supabase Storage

### Source Control

- Git
- GitHub

### Deployment

- Vercel

### Generated Documents

Use appropriate libraries/tools for:

- DOCX
- XLSX
- PPTX
- PDF
- ZIP

---

# 5. High-Level Architecture

```text
                         USER
                           |
                           v
                 +-------------------+
                 |   Web Application |
                 |     Frontend      |
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 | Node.js / TS API  |
                 |    Backend        |
                 +---------+---------+
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   +-------------+   +-------------+   +-------------+
   |  Supabase   |   |  Document   |   | AI Provider |
   | DB + Storage|   | Processing  |   | Orchestrator|
   +-------------+   +------+------+   +------+------+
                           |                   |
                           v             +-----+-----+
                    +-------------+      |           |
                    | MarkItDown  |      v           v
                    | + OCR       |   Gemini      DeepSeek
                    +------+------+      |           |
                           |             +-----+-----+
                           v                   |
                  Markdown + JSON + OCR        |
                           |                   |
                           +---------+---------+
                                     |
                                     v
                           Proposal Intelligence
                                     |
                                     v
                           Human Approval Workflow
                                     |
                                     v
                        DOCX / XLSX / PPTX / ZIP
                                     |
                                     v
                              Final Submission
```

---

# 6. AI Model Orchestration

## 6.1 Gemini — Primary AI

Gemini should primarily handle:

- PDF/document understanding
- scanned document interpretation
- OCR assistance where required
- long-document analysis
- TOR/RFP/RFQ/EOI analysis
- requirement extraction
- structured information extraction
- previous proposal analysis
- company document analysis
- CV analysis
- experience matching
- proposal drafting
- form population assistance

## 6.2 DeepSeek — Secondary AI

DeepSeek should primarily handle:

- independent reasoning
- requirement interpretation review
- proposal critique
- contradiction detection
- compliance review
- second-opinion analysis
- identifying unsupported claims
- identifying weaknesses in methodology
- identifying gaps in proposal responses

## 6.3 Dual-Model Review

For high-risk requirements, the system may send structured information to both models.

Example:

```text
TOR Requirement
       |
       +----> Gemini interpretation
       |
       +----> DeepSeek interpretation
       |
       v
Conflict Detection
       |
       v
Human Review if disagreement
```

The system must not automatically choose one model when the models disagree on a mandatory requirement.

---

# 7. Document Ingestion and OCR

## 7.1 Mandatory Requirement

Document processing is a core feature.

The user must **not be required to manually OCR documents before uploading them**.

The application must automatically determine how the document should be processed.

---

## 7.2 Supported Inputs

The system should support:

- PDF
- scanned PDF
- DOCX
- XLSX
- XLS
- PPTX
- PPT
- images
- TXT
- CSV
- ZIP where appropriate

---

# 8. Document Processing Pipeline

```text
UPLOAD
  |
  v
File Type Detection
  |
  v
Document Inspection
  |
  +---- Searchable?
  |        |
  |        +---- YES ---> Direct Extraction
  |
  +---- NO ----> OCR / Vision Processing
                     |
                     v
                Text Extraction
                     |
                     v
              Structure Detection
                     |
                     v
             Markdown + JSON
                     |
                     v
              AI Analysis
```

---

## 8.1 Microsoft MarkItDown

Microsoft MarkItDown should be used as the primary local document-to-Markdown conversion layer where appropriate.

The system should use it for formats such as:

- PDF
- DOCX
- PPTX
- XLSX
- CSV
- HTML
- other supported formats

The processing should occur locally/server-side rather than sending every document to an external conversion API.

---

## 8.2 Scanned PDF Processing

The system must detect whether a PDF contains meaningful searchable text.

If searchable text exists:

```text
PDF
→ Text Extraction
→ Markdown
→ Structured Analysis
```

If it is image-only/scanned:

```text
Scanned PDF
→ OCR / Vision
→ Text + Layout Extraction
→ Markdown
→ Structured Analysis
```

Where appropriate, Gemini's document/vision capability may be used to improve extraction of:

- tables
- forms
- handwriting where technically feasible
- stamps/seals
- page structure
- images
- diagrams
- complex layouts

---

# 9. OCR Quality and Verification

OCR output must not automatically be treated as verified fact.

The system should identify possible OCR uncertainty in:

- names
- numbers
- dates
- financial amounts
- TIN
- BIN
- registration numbers
- certificate numbers
- reference numbers
- addresses
- percentages
- currency values

Example:

```text
OCR Confidence: REVIEW REQUIRED

Extracted:
TIN: 123456789

Possible OCR ambiguity detected.

[View Original]
[Accept]
[Correct]
```

---

# 10. Source Traceability

Every extracted important fact should maintain source metadata where technically possible.

Example:

```json
{
  "value": "Minimum 5 years experience",
  "source_file": "TOR.pdf",
  "page": 8,
  "source_type": "TOR",
  "confidence": 0.96
}
```

The application should allow the user to navigate from an AI finding to the relevant source document/page.

---

# 11. Permanent Knowledge Base

The system must have a persistent organizational Knowledge Base.

Users should **not need to upload the same company documents for every proposal**.

---

# 12. Knowledge Base Categories

## 12.1 Company Information

Examples:

- Company profile
- Organization profile
- Company history
- Services
- Areas of expertise
- Organizational structure
- Partners
- Management information
- Office information
- Standard corporate information

---

## 12.2 Corporate / Legal Documents

Examples:

- Incorporation documents
- Trade license
- Professional registration
- Membership certificates
- Registration certificates
- Other corporate credentials

---

## 12.3 Tax and VAT

Examples:

- TIN certificate
- BIN certificate
- VAT documents
- Tax certificates
- Other statutory documents

---

## 12.4 CV Database

Maintain structured CV records for:

- Partners
- Team Leaders
- Managers
- Consultants
- Technical specialists
- Financial specialists
- IT specialists
- ESG specialists
- Other experts

Each CV should be indexed for:

- education
- qualifications
- certifications
- years of experience
- sector experience
- assignment experience
- geographic experience
- role
- technical expertise
- language
- employment history

---

## 12.5 Experience & Credentials

Store:

- Work orders
- Completion certificates
- Experience certificates
- Engagement letters
- Client references
- Contract documents
- Assignment descriptions
- Other supporting evidence

Each experience record should ideally contain:

```text
Client
Assignment Title
Sector
Assignment Type
Scope
Start Date
End Date
Contract Value
Role
Services Provided
Country
Evidence Documents
```

---

# 13. Previous Proposal Library

Previous proposals are a major knowledge source.

Categories should include:

- Audit
- Internal Audit
- IT Audit
- Consulting
- Management Audit
- Forensic
- ESG & Sustainability
- Financial Advisory
- Technology/Data
- EOI
- RFQ
- RFP
- Other

The system should analyze previous proposals rather than merely storing them.

---

# 14. Proposal Style Intelligence

The system must **not require the user to manually create a proposal template or style guide**.

Instead, it should analyze previous successful/current proposals and identify patterns such as:

- document structure
- section order
- heading hierarchy
- writing tone
- terminology
- paragraph style
- tables
- cover-page style
- team presentation
- methodology presentation
- graphics
- use of colors
- proposal length
- PPTX design
- financial proposal structure

---

# 15. Style Options

After analyzing relevant previous proposals, the system should generate 2–3 style/structure options.

Example:

### Option A — Traditional Corporate

- Formal
- Detailed
- Audit/consulting oriented

### Option B — Modern Consulting

- More visual
- Executive-friendly
- Strong section hierarchy

### Option C — Existing House Style

- Closely follows the organization's previous proposal style

The user selects one.

The selected style becomes the working style for the project.

The system may optionally allow the user to designate a preferred style as the default for future proposals.

---

# 16. New Project Workflow

## Step 1 — Create Project

User selects:

**New Proposal**

The system asks for:

- Project name
- Client
- Assignment title
- Proposal type
- Optional deadline

---

## Step 2 — Upload Project Documents

User uploads:

- TOR
- RFP
- RFQ
- EOI
- tender documents
- client forms
- annexures
- financial templates
- prescribed formats
- project-specific supporting documents

The user should not need to upload permanent company information again.

---

# 17. Automatic Ingestion

Immediately after upload:

```text
Upload
→ File Detection
→ Extraction/OCR
→ Markdown
→ Metadata
→ Indexing
→ AI Analysis
```

The UI should show progress.

Example:

```text
TOR.pdf

✓ Uploaded
✓ File detected
✓ OCR completed
✓ Text extracted
✓ Tables detected
✓ Requirements analyzed
✓ Indexed
```

---

# 18. TOR / RFP Analysis

The AI must analyze the complete document before drafting.

It should identify:

### Tender Metadata

- Client
- Assignment title
- Reference number
- Deadline
- Submission date
- Submission time
- Submission method
- Submission location
- Contact person
- Contact information
- Assignment duration
- Start date
- Location
- Currency
- Proposal validity
- Language

---

# 19. Eligibility Requirements

Identify:

- legal registration
- minimum years of experience
- turnover
- similar assignments
- sector experience
- geographic experience
- professional qualifications
- certifications
- financial requirements
- tax requirements
- VAT requirements
- mandatory registrations
- consortium/JV requirements
- other eligibility criteria

---

# 20. Technical Requirements

Identify:

- background
- objectives
- scope
- tasks
- deliverables
- methodology
- work plan
- staffing
- personnel requirements
- qualifications
- team composition
- timeline
- reporting
- quality assurance
- risk management
- stakeholder engagement
- technology requirements
- sustainability requirements

---

# 21. Financial Requirements

Identify:

- financial proposal requirement
- price schedule
- BOQ
- personnel rates
- person-days
- reimbursables
- travel
- accommodation
- VAT
- taxes
- currency
- payment schedule
- fee validity
- cost breakdown
- prescribed financial template

Financial figures must never be invented.

---

# 22. Administrative Requirements

Identify:

- cover letter
- letter of submission
- declarations
- eligibility forms
- conflict-of-interest declaration
- authorized signatory
- consortium/JV documents
- power of attorney
- signature requirements
- seal requirements
- submission instructions
- electronic submission requirements
- physical submission requirements
- envelope requirements
- file naming requirements

---

# 23. Prescribed Forms

The system must identify **every prescribed form, annexure, schedule, declaration and template**.

For each form:

```text
Form Name
Form Number
Mandatory
File Format
Required Information
Signature Required
Source Page
Status
```

---

# 24. Requirement Matrix

The Requirement Matrix is the primary compliance-control mechanism.

Required columns:

| Field | Description |
|---|---|
| Requirement | Requirement description |
| Category | Technical / Financial / Administrative / Eligibility |
| Mandatory | Yes / No |
| Source | File and page |
| Available | Yes / No / Partial |
| Status | Ready / Missing / Review Required |
| Evidence | Supporting document |
| Action | Required user action |
| AI Confidence | Confidence score |
| Reviewer Comment | Human comment |

Example:

| Requirement | Mandatory | Available | Status |
|---|---:|---:|---|
| TIN Certificate | Yes | Yes | READY |
| BIN Certificate | Yes | Yes | READY |
| 5 Years Similar Experience | Yes | Partial | REVIEW REQUIRED |
| Team Leader CV | Yes | Yes | READY |
| Financial Proposal | Yes | No | MISSING |
| Prescribed Form 4 | Yes | Yes | READY |

---

# 25. Knowledge Base Matching

The system should automatically search the permanent Knowledge Base against requirements.

Matching must be **semantic/content-based**, not filename-based.

---

# 26. Experience Matching

For each relevant assignment, consider:

- sector
- assignment type
- scope
- client
- dates
- geography
- services
- contract value
- similarity
- evidence availability

Example output:

```text
Recommended Experience #1
Similarity: 94%

Client: ABC Ltd.
Assignment: Internal Audit & Process Review
Sector: Manufacturing
Relevant Scope: Internal control, process review, risk assessment
Evidence: Completion Certificate available
```

---

# 27. CV Matching

Match candidates based on:

- years of experience
- education
- certifications
- technical expertise
- sector experience
- similar assignments
- role suitability
- geographic experience
- language requirements

The system should rank candidates.

Example:

```text
1. Candidate A — 95%
2. Candidate B — 89%
3. Candidate C — 81%
```

The user must approve the final team.

---

# 28. Evidence Recommendation

For every major requirement, the system should recommend supporting evidence.

Example:

```text
Requirement:
Minimum 5 similar assignments.

Recommended:
✓ Experience Certificate A
✓ Work Order B
✓ Completion Certificate C
✓ Previous Proposal reference
```

---

# 29. Proposal Generation Workflow

After requirements and supporting evidence are approved:

```text
TOR Analysis
      ↓
Requirement Matrix
      ↓
Evidence Selection
      ↓
CV Selection
      ↓
Experience Selection
      ↓
Style Selection
      ↓
Technical Proposal Draft
      ↓
Human Review
      ↓
Financial Proposal
      ↓
Forms
      ↓
PPTX
      ↓
Compliance Check
      ↓
Final Package
```

---

# 30. Technical Proposal

The system should generate relevant sections based on the TOR.

Potential sections:

1. Cover Page
2. Letter of Submission
3. Executive Summary
4. Understanding of the Assignment
5. Background
6. Objectives
7. Scope of Services
8. Methodology
9. Approach
10. Work Plan
11. Deliverables
12. Timeline
13. Team Structure
14. Key Personnel
15. Relevant Experience
16. Quality Assurance
17. Risk Management
18. Reporting
19. Stakeholder Engagement
20. Value Addition
21. Conclusion

The system must adapt the structure to the actual TOR.

It must not blindly include irrelevant sections.

---

# 31. Proposal Writing Rules

Generated proposal content must:

- directly respond to the TOR
- use professional consulting language
- avoid unsupported claims
- avoid generic AI filler
- use actual organizational experience
- use approved CV information
- align methodology with deliverables
- align work plan with timeline
- align staffing with requirements
- maintain consistency across sections

---

# 32. Financial Proposal

Financial proposal generation is a core feature.

The system should determine whether the tender requires:

- fee schedule
- BOQ
- personnel rates
- person-days
- reimbursables
- taxes
- VAT
- travel
- other costs
- payment milestones

If a client template exists:

**Use and populate the client template.**

Do not recreate it unnecessarily.

If no template exists:

Generate a professional financial proposal appropriate to the assignment.

---

# 33. Financial Safety Rules

AI must never independently invent:

- fees
- rates
- person-days
- expenses
- VAT amounts
- tax amounts
- contract value
- payment terms

If the user has not provided the required figure:

```text
FINANCIAL INPUT REQUIRED
```

Calculations must be performed by application code, not by AI reasoning.

Example:

```text
Fee = 500,000
VAT Rate = 15%

VAT = application calculation
Total = application calculation
```

The user must approve the final financial proposal.

---

# 34. Prescribed Form Population

The system should populate forms using:

- company database
- project information
- approved CVs
- approved experience
- TOR requirements

Missing information must be flagged.

The system must not fabricate signatures.

Signature fields should remain available for human completion.

---

# 35. Existing PPTX Handling

PPTX is a core supported output.

The system must support two situations:

### Situation A — No Existing PPTX

Generate a presentation using the selected proposal style.

### Situation B — Existing PPTX Provided

The system must analyze the existing presentation and make **only the changes required by the new TOR/project**.

---

# 36. PPTX Preservation Rule

This is a critical requirement.

If the existing PPTX is already acceptable:

**DO NOT REDESIGN IT.**

Preserve wherever possible:

- theme
- slide master
- layout
- fonts
- font sizes
- colors
- images
- icons
- charts
- tables
- spacing
- slide order
- animations
- transitions
- branding

Only modify content that needs to change.

---

# 37. PPTX Change Planning

Before editing, generate a change plan.

Example:

```text
Slide 1
Change Client Name
Status: Required

Slide 2
Change Assignment Title
Status: Required

Slide 3
No change
Status: Preserve

Slide 4
Update methodology
Status: Required

Slide 5
No change
Status: Preserve

Slide 6
Replace Team Leader
Status: Required
```

The user can approve the changes before generation.

---

# 38. PPTX Change Log

Every modified PPTX must have a change log.

Example:

```text
Slide 1:
Updated client name.

Slide 4:
Updated methodology based on TOR.

Slide 7:
Replaced Team Leader CV.

Slides 2, 3, 5, 6, 8:
No changes.
```

The original PPTX must remain untouched.

---

# 39. Proposal Review

The user should be able to review:

- document
- section
- requirement
- evidence
- CV
- experience
- financial figures
- forms
- PPTX changes

Actions:

- Approve
- Reject
- Edit
- Regenerate
- Replace
- Add information
- Mark as accepted

---

# 40. AI Review

After proposal generation, DeepSeek should be able to independently review the proposal.

Review areas:

- TOR alignment
- missing requirements
- unsupported claims
- inconsistencies
- contradictions
- methodology weaknesses
- staffing mismatch
- timeline mismatch
- deliverable mismatch
- financial inconsistencies
- formatting issues
- prescribed form omissions

---

# 41. Final Compliance Check

Before final ZIP generation, the system must run a final compliance check.

Example:

```text
FINAL COMPLIANCE CHECK

Technical Proposal       ✓
Financial Proposal       ✓
Prescribed Forms         ✓
Company Documents        ✓
CVs                      ✓
Experience Evidence      ✓
TIN                      ✓
BIN                      ✓
Authorized Signature     ⚠ REVIEW
Mandatory Declaration    ✗ MISSING
PPTX                     ✓
```

---

# 42. Final Status

Possible project status:

### READY

All mandatory requirements satisfied.

### REVIEW REQUIRED

Potential issue requiring human review.

### MISSING

Mandatory information/document missing.

### AI RECOMMENDATION

AI suggests an action but user approval is required.

---

# 43. Blocking Rules

The system should prevent final package generation if a mandatory requirement remains:

**MISSING**

unless the user explicitly overrides it.

If overridden, the system should record:

```text
Requirement
Override By
Override Date
Reason
```

---

# 44. Submission Package

The system should generate a dynamic submission folder based on the actual tender.

Example:

```text
CLIENT_PROPOSAL/
│
├── 00_Submission_Checklist.xlsx
│
├── 01_Technical_Proposal/
│   └── Technical_Proposal.docx
│
├── 02_Financial_Proposal/
│   └── Financial_Proposal.xlsx
│
├── 03_Prescribed_Forms/
│   ├── Form_01.docx
│   ├── Form_02.docx
│   └── Declaration.pdf
│
├── 04_Company_Documents/
│   ├── TIN.pdf
│   ├── BIN.pdf
│   └── Trade_License.pdf
│
├── 05_CVs/
│   ├── Team_Leader.pdf
│   └── Expert_02.pdf
│
├── 06_Experience_Documents/
│   ├── Experience_01.pdf
│   └── Experience_02.pdf
│
├── 07_Additional_Documents/
│
└── 08_PPTX/
    └── Proposal_Presentation.pptx
```

The actual folder structure must adapt to the tender.

Do not create unnecessary folders.

---

# 45. Submission Checklist.xlsx

Generate an Excel checklist containing:

| Item | Required | Included | Status | Source | Remarks |
|---|---:|---:|---|---|---|
| Technical Proposal | Yes | Yes | Ready | TOR p.12 | |
| Financial Proposal | Yes | Yes | Ready | TOR p.13 | |
| Form 1 | Yes | Yes | Ready | TOR p.20 | |
| TIN | Yes | Yes | Ready | TOR p.8 | |
| CV Team Leader | Yes | Yes | Ready | TOR p.15 | |
| Experience Certificate | Yes | No | Missing | TOR p.16 | |

---

# 46. ZIP Generation

The system should generate a final ZIP.

Example:

```text
[Client Name]_[Assignment Name]_Proposal_Submission.zip
```

The ZIP must contain only final submission materials.

It must NOT contain:

- AI logs
- temporary files
- API keys
- internal database files
- prompts
- drafts
- rejected documents
- unrelated documents
- internal notes
- debug files

unless explicitly required by the tender.

---

# 47. Version Control

Proposal versions should be maintained.

Example:

```text
v0.1
Initial AI Draft

v0.2
User Revision

v0.3
AI Revision

v0.4
Financial Update

v1.0
Final Approved
```

Every generated file should have version metadata.

---

# 48. Knowledge Base vs Project Files

The application must clearly separate:

## Permanent Knowledge Base

Reusable across projects.

Examples:

- Company profile
- CVs
- Experience
- Legal documents
- Tax documents
- Previous proposals

## Project Workspace

Specific to one tender.

Examples:

- TOR
- RFP
- RFQ
- EOI
- Client forms
- Project-specific instructions
- Current proposal drafts
- Current financial proposal

Project files must not automatically become permanent knowledge unless the user explicitly chooses:

**Add to Knowledge Base**

---

# 49. Dashboard

Main dashboard should display:

```text
AI PROPOSAL AGENT

[ + New Proposal ]

Knowledge Base
-------------------------
Company Documents     24
CVs                   48
Experience            137
Previous Proposals    62

Active Projects
-------------------------
Project A     72%     Review
Project B     91%     Ready
Project C     43%     Missing Documents

Recent Projects
-------------------------
...
```

---

# 50. Project Workspace

Each project should have:

### Overview

- Client
- Assignment
- Deadline
- Status
- Progress

### Documents

- Uploaded documents
- OCR status
- extracted Markdown
- source files

### Requirements

- Requirement matrix

### Matching

- CV recommendations
- experience recommendations
- supporting evidence

### Proposal

- Technical proposal
- Financial proposal
- Forms

### PPTX

- Existing presentation
- Change plan
- Revised presentation
- Change log

### Compliance

- Final checklist

### Output

- Final folder
- ZIP

---

# 51. Knowledge Base UI

Provide sections:

```text
Knowledge Base

├── Company Information
├── Legal & Corporate
├── Tax & VAT
├── CV Database
├── Experience & Credentials
├── Previous Proposals
└── Other
```

Functions:

- Upload
- Search
- Preview
- Edit metadata
- Archive
- Replace
- Delete
- Add to project
- Analyze
- View source

---

# 52. Search

The Knowledge Base search should support semantic search.

Examples:

User searches:

> "Previous textile sustainability assignments"

System should return relevant experience even if the file name does not contain those exact words.

Search should consider:

- content
- metadata
- sector
- assignment type
- expertise
- client
- dates
- keywords
- embeddings where appropriate

---

# 53. Data Model

Suggested core tables:

```text
users
projects
project_members
documents
document_versions
document_chunks
document_extractions
ocr_jobs
requirements
requirement_evidence
company_profiles
company_documents
experts
expert_documents
experiences
experience_documents
previous_proposals
proposal_versions
proposal_sections
financial_proposals
prescribed_forms
generated_files
pptx_change_sets
compliance_checks
ai_runs
ai_reviews
audit_logs
```

---

# 54. Document Metadata

Each document should store:

```text
id
project_id
knowledge_base_category
file_name
file_type
storage_path
file_size
uploaded_by
upload_date
processing_status
ocr_status
extraction_status
markdown_path
source_hash
version
confidentiality_level
```

---

# 55. AI Run Logging

Each AI operation should store:

```text
provider
model
task
input_reference
output_reference
timestamp
status
error
token/usage information where available
```

Do not store API keys.

---

# 56. API Key Security

API keys must never be placed in:

- frontend JavaScript
- HTML
- public GitHub repository
- client-side environment variables
- generated files

Use server-side environment variables.

Example:

```env
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Secrets must not be committed to Git.

---

# 57. Environment Configuration

The system should support:

```env
PRIMARY_AI_PROVIDER=gemini
SECONDARY_AI_PROVIDER=deepseek

GEMINI_API_KEY=
DEEPSEEK_API_KEY=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Development and production environments must use separate secrets where appropriate.

---

# 58. AI Provider Abstraction

Do not write application logic like:

```text
if task == X:
    directly call Gemini everywhere
```

Instead create an abstraction such as:

```text
AIProvider
├── GeminiProvider
└── DeepSeekProvider
```

Example conceptual interface:

```text
analyzeDocument()
extractRequirements()
generateContent()
reviewContent()
matchEvidence()
```

This allows models to be changed later.

---

# 59. Rate Limit Handling

Because Gemini may be used without paid billing, the application must gracefully handle API limits.

When rate-limited:

```text
Request queued
     ↓
Retry with backoff
     ↓
If still unavailable
     ↓
Show user status
```

The system should avoid repeatedly sending the same document unnecessarily.

Cache completed processing results.

---

# 60. Processing Cache

If a document has already been processed and its content has not changed:

Do not repeat:

- OCR
- Markdown conversion
- extraction
- unnecessary AI analysis

Use document hashing.

Example:

```text
SHA-256(document)
```

If the hash already exists:

```text
Existing processed document found.
Reuse previous extraction?
[Yes]
```

---

# 61. Structured AI Outputs

For machine-readable AI tasks, use structured JSON rather than free-form text.

Example:

```json
{
  "requirements": [
    {
      "requirement": "Minimum five years similar experience",
      "category": "eligibility",
      "mandatory": true,
      "source_page": 8
    }
  ]
}
```

Validate AI-generated JSON in application code before saving.

---

# 62. AI Hallucination Controls

The system should distinguish:

### SOURCE FACT

Directly supported by an uploaded document.

### USER INPUT

Entered or approved by the user.

### AI INFERENCE

Reasoned conclusion by the AI.

### GENERATED CONTENT

New proposal text created by AI.

Example:

```text
Client Name
Source Fact

Experience Match
AI Inference

Methodology
Generated Content
```

This distinction should be visible where appropriate.

---

# 63. Conflict Detection

The system should detect inconsistencies such as:

```text
TOR:
Project duration = 6 months

Proposal:
Project duration = 9 months

⚠ CONTRADICTION DETECTED
```

Other checks:

- team role mismatch
- timeline mismatch
- deliverable mismatch
- financial total mismatch
- client name mismatch
- assignment title mismatch
- dates mismatch
- qualification mismatch

---

# 64. User Permissions

Suggested roles:

### Admin

Full access.

### Proposal Manager

Create/manage projects and proposals.

### Reviewer

Review and approve AI output.

### Knowledge Base Manager

Manage company documents, CVs and experience.

### Viewer

Read-only access.

---

# 65. Audit Trail

Record important actions:

```text
User
Action
Project
Document
Timestamp
Old Value
New Value
```

Examples:

- requirement approved
- CV selected
- experience rejected
- proposal edited
- financial amount changed
- compliance override
- final ZIP generated

---

# 66. UI/UX Requirements

The interface should be professional and suitable for an accounting/consulting organization.

Requirements:

- desktop-first
- responsive
- clean dashboard
- clear status indicators
- drag-and-drop uploads
- progress indicators
- document preview
- side-by-side source/reference view where possible
- searchable tables
- filters
- approval buttons
- clear warnings
- no unnecessary animations

Avoid excessive AI-chat styling.

This is a **professional workflow application**, not primarily a chatbot.

---

# 67. New Proposal Wizard

Recommended steps:

```text
1. Project Information
2. Upload TOR/RFP/RFQ/EOI
3. Automatic OCR & Extraction
4. Requirement Analysis
5. Requirement Review
6. Evidence Matching
7. CV Matching
8. Proposal Style Selection
9. Technical Proposal
10. Financial Proposal
11. Prescribed Forms
12. PPTX
13. AI Review
14. Compliance Check
15. Final Approval
16. ZIP
```

Users should be able to return to previous steps.

---

# 68. Approval Gates

Human approval should be required at:

1. TOR analysis
2. Requirement matrix
3. CV selection
4. Experience selection
5. Proposal style
6. Technical proposal
7. Financial proposal
8. Prescribed forms
9. PPTX changes
10. Final compliance
11. ZIP generation

---

# 69. Error Handling

The application must clearly handle:

- unsupported file
- corrupted file
- OCR failure
- extraction failure
- AI timeout
- API rate limit
- AI provider failure
- Supabase failure
- document generation failure
- PPTX modification failure
- ZIP generation failure

Errors should be user-friendly.

Example:

```text
OCR could not be completed.

The original document is محفوظ/available for verification.

[Retry]
[Use Alternative Processing]
```

---

# 70. Recovery

Long-running tasks should not lose progress if the browser closes.

Examples:

```text
OCR: 100%
Requirement Analysis: 70%
```

When the user returns, the system should resume or display the current state.

---

# 71. Background Jobs

Long operations should run as background jobs where practical:

- OCR
- document conversion
- embeddings
- AI analysis
- proposal generation
- PPTX modification
- final compliance
- ZIP generation

Do not block the browser unnecessarily.

---

# 72. Security Requirements

The application will handle confidential corporate and tender information.

Minimum requirements:

- HTTPS
- authenticated access
- role-based access
- secure Supabase Storage policies
- server-side API keys
- environment secrets
- no secrets in Git
- project-level access controls
- audit logging
- secure file downloads
- file type validation
- file size limits
- malware/security scanning where practical

---

# 73. Supabase Storage Structure

Suggested structure:

```text
storage/
│
├── knowledge-base/
│   ├── company/
│   ├── legal/
│   ├── tax/
│   ├── cvs/
│   ├── experience/
│   └── previous-proposals/
│
└── projects/
    └── {project_id}/
        ├── source/
        ├── processed/
        ├── drafts/
        ├── final/
        └── submission/
```

---

# 74. Deployment

## Development

```text
Local PC
   ↓
Git
   ↓
GitHub
```

## Production

```text
GitHub
   ↓
Vercel
   ↓
Web Application
   ↓
Supabase
   ↓
AI APIs
```

Document processing that requires Python/system-level processing should be architected separately from the Vercel frontend/serverless runtime where necessary.

Do not assume Vercel's local filesystem is persistent.

Permanent files belong in Supabase Storage.

---

# 75. Git Requirements

Use Git from the beginning.

Recommended branches:

```text
main
develop
feature/*
```

Never commit:

```text
.env
API keys
Supabase service keys
temporary documents
client proposal files
private company documents
generated submission packages
```

---

# 76. Recommended Project Structure

```text
proposal-agent/
│
├── app/
│   ├── frontend/
│   └── backend/
│
├── src/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── gemini.ts
│   │   │   └── deepseek.ts
│   │   ├── orchestration/
│   │   └── prompts/
│   │
│   ├── documents/
│   │   ├── ingestion/
│   │   ├── markdown/
│   │   ├── ocr/
│   │   ├── extraction/
│   │   └── indexing/
│   │
│   ├── knowledge-base/
│   ├── projects/
│   ├── requirements/
│   ├── matching/
│   ├── proposals/
│   ├── financial/
│   ├── forms/
│   ├── pptx/
│   ├── compliance/
│   ├── exports/
│   └── security/
│
├── python/
│   └── document-processing/
│
├── supabase/
│   ├── migrations/
│   └── functions/
│
├── tests/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

The exact structure may be adapted by the development agent, but responsibilities should remain modular.

---

# 77. MVP Scope

The first working version should prioritize:

### Phase 1

- Authentication
- Dashboard
- Supabase connection
- Knowledge Base
- Project creation
- File upload
- PDF/DOCX/PPTX/XLSX ingestion
- MarkItDown conversion
- OCR pipeline
- Gemini integration
- TOR analysis
- Requirement matrix
- Knowledge Base search
- CV matching
- Experience matching
- Basic technical proposal generation
- Human approval

### Phase 2

- DeepSeek integration
- Dual-model review
- Financial proposal
- Prescribed forms
- Advanced source traceability
- PPTX minimal-change editing
- Compliance engine
- Submission Checklist.xlsx
- ZIP generation

### Phase 3

- Advanced semantic search
- Embeddings
- Advanced document comparison
- Proposal quality scoring
- reusable style profiles
- analytics
- advanced collaboration
- workflow automation

---

# 78. Non-Functional Requirements

The system should be:

### Reliable

Failed processing should be retryable.

### Maintainable

AI providers and document processors must be replaceable.

### Scalable

Database and storage architecture should support many projects and documents.

### Secure

Confidential files must not become public.

### Auditable

Important actions must be traceable.

### Explainable

AI recommendations should show reasoning/evidence where appropriate.

### Fast

Simple UI actions should respond quickly while heavy processing runs asynchronously.

---

# 79. Acceptance Criteria

The MVP will be considered successful when the system can:

### Document Processing

- Upload a searchable PDF.
- Extract text.
- Convert it to Markdown.
- Upload a scanned PDF.
- Detect that OCR is required.
- OCR/process the scanned PDF.
- Preserve source page references.
- Process DOCX.
- Process PPTX.
- Process XLSX.

### TOR Analysis

- Identify client.
- Identify assignment.
- Identify deadline.
- Identify scope.
- Identify deliverables.
- Identify eligibility criteria.
- Identify team requirements.
- Identify financial requirements.
- Identify prescribed forms.
- Produce a requirement matrix.

### Knowledge Base

- Store company documents permanently.
- Store CVs.
- Store experience.
- Store previous proposals.
- Search semantically.
- Recommend evidence.

### Proposal

- Generate a technical proposal.
- Use approved company information.
- Use approved experience.
- Use approved CVs.
- Maintain source traceability.
- Allow human editing.

### Financial

- Detect financial requirements.
- Populate a provided financial template.
- Generate calculations through application code.
- Require human approval.

### PPTX

- Upload an existing PPTX.
- Analyze required changes.
- Display change plan.
- Change only required content.
- Preserve existing design where possible.
- Generate a separate revised PPTX.
- Produce a change log.

### Compliance

- Check all mandatory requirements.
- Identify missing items.
- Block finalization for unresolved mandatory gaps unless explicitly overridden.

### Submission

- Generate checklist.
- Create dynamic folder structure.
- Generate final ZIP.
- Exclude internal AI/system files.

---

# 80. Critical Rules for the Coding Agent

The development AI must follow these rules throughout implementation:

1. **Do not hard-code proposal content.**
2. **Do not hard-code company information.**
3. **Do not fabricate missing information.**
4. **Do not overwrite source files.**
5. **Do not expose API keys.**
6. **Do not put API keys in frontend code.**
7. **Do not rely on Vercel local storage for permanent files.**
8. **Use Supabase for persistent storage.**
9. **Use Git/GitHub for source control.**
10. **Use environment variables for secrets.**
11. **Use structured JSON for machine-readable AI tasks.**
12. **Validate AI outputs before database insertion.**
13. **Keep AI modules separate from business logic.**
14. **Keep Gemini and DeepSeek behind provider abstractions.**
15. **Do not send the same document repeatedly if it has already been processed.**
16. **Do not unnecessarily OCR searchable PDFs.**
17. **Do not treat OCR output as automatically verified.**
18. **Do not invent financial values.**
19. **Do not fabricate signatures.**
20. **Do not redesign an existing PPTX unnecessarily.**
21. **Preserve existing PPTX design wherever possible.**
22. **Require human approval for critical decisions.**
23. **Show source evidence for important extracted facts.**
24. **Block final submission if mandatory requirements are unresolved unless the user explicitly overrides them.**
25. **Keep project-specific files separate from the permanent Knowledge Base.**
26. **Maintain version history for generated proposals.**
27. **Do not include drafts or internal files in the final ZIP.**
28. **Design the application so AI providers can be replaced later.**
29. **Build the document/OCR pipeline as a modular service.**
30. **Prioritize correctness and traceability over autonomous generation.**

---

# 81. Final Product Vision

The completed application should allow the user to do essentially this:

```text
UPLOAD TOR
    ↓
Automatic OCR / Document Processing
    ↓
AI Reads & Understands TOR
    ↓
Requirements Extracted
    ↓
Compliance Matrix Created
    ↓
Company Knowledge Base Searched
    ↓
Best CVs Selected
    ↓
Best Experience Selected
    ↓
Best Supporting Evidence Selected
    ↓
Previous Proposals Analyzed
    ↓
2–3 Proposal Styles Suggested
    ↓
User Selects Style
    ↓
Technical Proposal Generated
    ↓
User Reviews & Approves
    ↓
Financial Proposal Prepared
    ↓
Prescribed Forms Populated
    ↓
Existing PPTX Updated Only Where Required
    ↓
DeepSeek Independent Review
    ↓
Gemini / Application Compliance Check
    ↓
Missing Items Identified
    ↓
User Resolves Outstanding Issues
    ↓
FINAL COMPLIANCE CHECK
    ↓
Submission Checklist.xlsx
    ↓
Submission Folder
    ↓
FINAL ZIP
```

The objective is not simply to build an AI chatbot that writes proposals.

The objective is to build a **controlled proposal-production system** where AI handles document understanding, retrieval, matching, drafting and review while the application controls evidence, compliance, calculations, files, versions and final submission integrity.