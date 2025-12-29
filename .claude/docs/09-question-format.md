# Question Format Specification

## Overview

This document defines the markdown format for exam questions. The parser (`lib/parsers/markdown.ts`) must handle this format when importing questions from ZIP files.

---

## File Naming Convention

```
question-NNN.md
```

- `NNN` = zero-padded question number (001, 002, ... 346)
- Used to determine question order in the exam

---

## Complete Template

```markdown
# Question NNN

**Source:** https://example.com/question-source-url
**Section:** X.X - Section Name
**Tags:** tag1, tag2, tag3

---

## Question

Question text goes here. Can be multiple paragraphs.

For questions with images:
![Question Image](../images/question-NNN-img1.jpg)

## Choices

- **A.** First option text
- **B.** Second option text
- **C.** Third option text
- **D.** Fourth option text
- **E.** Fifth option text (optional)

---

## Answer

**Correct:** A

**Confidence:** high

### Explanation

Detailed explanation of why the correct answer is correct.

Can include multiple paragraphs.

### Why Other Options Are Wrong

- **B:** Explanation of why B is incorrect.

- **C:** Explanation of why C is incorrect.

- **D:** Explanation of why D is incorrect.

### References

- [Reference Title](https://docs.example.com/link1)
- [Another Reference](https://docs.example.com/link2)
```

---

## Field Reference

### Header Section

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Title | Yes | `# Question NNN` | `# Question 042` |
| Source | No | `**Source:** URL` | `**Source:** https://...` |
| Section | Yes | `**Section:** X.X - Name` | `**Section:** 2.3 - Establishing private connectivity` |
| Tags | No | `**Tags:** comma, separated` | `**Tags:** VPC, IAM, encryption` |

### Question Section

| Field | Required | Format | Notes |
|-------|----------|--------|-------|
| Question text | Yes | Free text after `## Question` | Can be multi-paragraph |
| Image | No | `![alt](../images/filename.jpg)` | Path relative to questions folder |

### Choices Section

| Field | Required | Format | Notes |
|-------|----------|--------|-------|
| Options | Yes | `- **X.** text` | Minimum 2, maximum 5 (A-E) |
| Option labels | Yes | A, B, C, D, E | Must be uppercase |

### Answer Section

| Field | Required | Format | Values |
|-------|----------|--------|--------|
| Correct | Yes | `**Correct:** X` or `**Correct:** X, Y` | Single or comma-separated letters |
| Confidence | Yes | `**Confidence:** level` | `high`, `medium`, `low` |
| Explanation | Yes | Text after `### Explanation` | Can be multi-paragraph |
| Why Wrong | No | `- **X:** reason` after `### Why Other Options Are Wrong` | One per incorrect option |
| References | No | Markdown links after `### References` | List of URLs |

---

## Parsing Rules

### 1. Question Number Extraction

```typescript
// From filename
const match = filename.match(/question-(\d+)\.md/);
const number = parseInt(match[1], 10); // 1, 2, 3... not 001
```

### 2. Section Parsing

```typescript
// Input: "**Section:** 2.3 - Establishing private connectivity"
// Output:
{
  sectionId: "2.3",
  section: "2.3 - Establishing private connectivity"
}
```

### 3. Tags Parsing

```typescript
// Input: "**Tags:** VPC, Private Google Access, network isolation"
// Output: ["VPC", "Private Google Access", "network isolation"]
```

### 4. Correct Answer Parsing

```typescript
// Single answer
// Input: "**Correct:** A"
// Output: ["A"]

// Multiple answers
// Input: "**Correct:** A, C"
// Output: ["A", "C"]
```

### 5. Options Parsing

```typescript
// Input: "- **A.** Use VPC Service Controls with an access level"
// Output: { "A": "Use VPC Service Controls with an access level" }
```

Note: Some options may contain "Most Voted" text from the source - strip this:
```typescript
// Input: "- **A.** Public IP Most Voted"
// Output: { "A": "Public IP" }
```

### 6. Image Path Resolution

```typescript
// Input (in markdown): ![Question Image](../images/question-167-img1.jpg)
// Resolved path: images/question-167-img1.jpg
// Destination: /public/images/{examId}/question-167-img1.jpg
```

---

## Rich Text Formatting (Must Preserve)

The parser must preserve markdown formatting in all text fields. The UI will render these using a markdown renderer.

### Question Body Formatting

```markdown
## Question

Plain text question with **bold** and `inline code`.

Questions can have multiple paragraphs like this one.

They may include images:
![Question Image](../images/question-167-img1.jpg)

Or bullet lists:
- First requirement
- Second requirement
- Third requirement

Or numbered steps:
1. First step
2. Second step
3. Third step
```

**Parser behavior:** Store the entire question body as-is (preserving newlines, formatting). Only strip the `## Question` header.

### Choice/Option Formatting

```markdown
- **A.** Plain text option
- **B.** Option with `inline code` like `gcloud compute instances create`
- **C.** Option with **bold emphasis** on key terms
- **D.** Multi-line option that
       continues on the next line
```

**Parser behavior:**
- Extract label (A, B, C...) separately from text
- Preserve inline formatting (`code`, **bold**, *italic*)
- Strip "Most Voted" suffix
- Handle multi-line options (rare but possible)

### Explanation Formatting

```markdown
### Explanation

The correct approach uses the following command:

` ` `bash
gcloud logging settings update --project=PROJECT_ID --storage-location=europe-west4
` ` `

Key points:
1. First numbered point with **emphasis**
2. Second point with `code reference`
3. Third point

Additional paragraph with more context.

- Bullet point one
- Bullet point two
```

**Parser behavior:** Store entire explanation as-is, including:
- Code blocks (```language ... ```)
- Numbered lists (1. 2. 3.)
- Bullet lists (- item)
- Bold/italic (**bold**, *italic*)
- Inline code (`code`)
- Multiple paragraphs (separated by blank lines)

### Why Wrong Formatting

```markdown
### Why Other Options Are Wrong

- **A:** **INCORRECT** - Explanation with `code` and **bold**.

- **B:** Explanation that spans
  multiple lines if needed.

- **C:** Short explanation.
```

**Parser behavior:**
- Key = option letter (A, B, C...)
- Value = full explanation text with formatting preserved
- Handle multi-line explanations

### Image Handling

| Location | Format | Storage |
|----------|--------|---------|
| Question body | `![alt](../images/file.jpg)` | `/public/images/{examId}/file.jpg` |
| Inline in text | Same format | Same storage |

**Parser behavior:**
1. Find all image references: `!\[.*?\]\((.*?)\)`
2. Extract relative path from parentheses
3. Copy image file to `/public/images/{examId}/`
4. Update path in stored text to `/images/{examId}/filename.jpg`

### Supported Markdown Elements

| Element | Syntax | Preserve? |
|---------|--------|-----------|
| Bold | `**text**` | Yes |
| Italic | `*text*` | Yes |
| Inline code | `` `code` `` | Yes |
| Code block | ` ```lang ``` ` | Yes |
| Bullet list | `- item` | Yes |
| Numbered list | `1. item` | Yes |
| Image | `![alt](path)` | Yes (update path) |
| Link | `[text](url)` | Yes |
| Paragraph | blank line | Yes |
| Blockquote | `> text` | Yes |
| Headers | `###` | Strip (use for section parsing) |

---

## Multi-Answer Questions

Questions may have multiple correct answers. Indicated by:

1. Question text contains "(Choose two)" or "(Choose X)"
2. Correct field has comma-separated values: `**Correct:** A, C`

The parser should:
- Detect multi-select from question text
- Store correct answers as array: `["A", "C"]`
- UI should render checkboxes instead of radio buttons

---

## Confidence Levels

| Level | Meaning | Typical Indicators |
|-------|---------|-------------------|
| `high` | Answer is definitively correct | Official docs confirm, community agrees |
| `medium` | Answer is likely correct | Some ambiguity, minor debate |
| `low` | Answer is uncertain | Significant community disagreement |

---

## Optional Sections to Ignore

The following sections may appear in source files but should be **ignored** by the parser:

### Community Section

```markdown
## Community

**Most Voted:** AC

**Votes:** AC: 100% (8 total)

**Top Comments:**
- (34 upvotes) Comment text...
```

This section contains crowdsourced data from the original source and is not needed for the study app.

---

## JSONB Output Structure

After parsing, each question should produce this structure for the `Question.data` field:

```typescript
interface QuestionData {
  // Core content
  text: string;
  options: Record<string, string>;  // { "A": "...", "B": "..." }
  correct: string[];                // ["A"] or ["A", "C"]

  // Explanation
  explanation: string;
  whyWrong?: Record<string, string>; // { "B": "...", "C": "..." }

  // Metadata
  section: string;                  // "2.3 - Establishing private connectivity"
  sectionId: string;                // "2.3"
  tags?: string[];                  // ["VPC", "IAM"]
  confidence: "high" | "medium" | "low";

  // Media
  imageUrl?: string;                // "/images/{examId}/question-167-img1.jpg"

  // Source
  sourceUrl?: string;               // Original URL
}
```

---

## Example: Parsed Output

**Input file:** `question-001.md`

**Parsed output:**
```json
{
  "number": 1,
  "data": {
    "text": "Your team needs to make sure that a Compute Engine instance does not have access to the internet or to any Google APIs or services. Which two settings must remain disabled to meet these requirements? (Choose two.)",
    "options": {
      "A": "Public IP",
      "B": "IP Forwarding",
      "C": "Private Google Access",
      "D": "Static routes",
      "E": "IAM Network User Role"
    },
    "correct": ["A", "C"],
    "explanation": "To prevent a Compute Engine instance from accessing the internet or Google APIs/services, two specific settings must remain disabled:\n\n**A. Public IP (External IP)**: When a Compute Engine VM lacks an external IP address...",
    "whyWrong": {
      "B": "This setting controls whether the VM can forward packets not destined for its own IP address. It's used for routing scenarios...",
      "D": "Routes control where network traffic is directed within and between networks...",
      "E": "This is an IAM role that controls who can perform network administration tasks..."
    },
    "section": "2.3 - Establishing private connectivity",
    "sectionId": "2.3",
    "tags": ["Private Google Access", "network isolation", "external IP", "VPC", "Compute Engine"],
    "confidence": "high",
    "sourceUrl": "https://www.examtopics.com/discussions/google/view/15917-exam-professional-cloud-security-engineer-topic-1-question-1/"
  }
}
```

---

## Validation Rules

The parser should validate:

1. **Required fields exist:**
   - Question title (# Question NNN)
   - Section metadata
   - Question text (## Question)
   - At least 2 options
   - Correct answer(s)
   - Confidence level
   - Explanation

2. **Correct answers are valid:**
   - Each letter in `correct` must exist in `options`
   - For "(Choose two)", exactly 2 answers should be marked correct

3. **Images exist:**
   - If question references an image, verify file exists in images folder

4. **Section ID format:**
   - Should match pattern `X.X` or `X.X.X` (e.g., "1.1", "2.3", "1.2.1")

---

## Error Handling

When parsing fails, return structured errors:

```typescript
interface ParseError {
  file: string;           // "question-050.md"
  line?: number;          // Line number if applicable
  error: string;          // "Missing ## Answer section"
  severity: "error" | "warning";
}
```

- **Errors**: Question cannot be imported (missing required field)
- **Warnings**: Question imported but may have issues (missing optional field)
