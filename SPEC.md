# AI Mystery Room — Project Specification

**File:** `SPEC.md`  
**Project:** AI Mystery Room  
**Purpose:** Blueprint for implementation, testing, and deployment  
**Status:** Initial implementation specification based on the provided project guide

---

## 1. Project Overview

### 1.1 Description
AI Mystery Room is an AI-powered web application where users create and solve mysteries generated using the Gemini API. Players investigate suspects, discover clues, request hints, and identify the culprit.

### 1.2 Problem Statement
Provide a complete, interactive mystery-solving experience in which a player can create a mystery premise, select a difficulty, investigate a case, use hints when needed, accuse a suspect, and receive a verdict and score.

### 1.3 Objective
Plan the project using this specification, build the application incrementally, test it against the acceptance criteria, deploy it, and demonstrate a complete mystery-solving experience on the live website.

### 1.4 Target Users
Users who enjoy interactive mystery stories, deduction, and solving fictional cases. The application should be understandable and usable without special instructions.

### 1.5 Expected User Experience
1. The user opens the website.
2. The user enters a mystery premise and selects a difficulty.
3. Gemini generates the mystery, suspects, clues, and hints.
4. The user investigates the case and discovers clues.
5. The user may request hints.
6. The user selects and submits an accusation.
7. The application reveals the verdict, culprit, explanation, and score.
8. The user can start another mystery.

### 1.6 Technology Stack
Use the stack specified in the project guide:

- **Frontend:** React, Vite, Tailwind CSS
- **Routing / HTTP:** React Router DOM, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **AI:** Gemini API using the `@google/genai` package
- **Validation:** Zod
- **Configuration:** dotenv
- **Cross-origin requests:** cors
- **Development utility:** nodemon

### 1.7 Project Limitations
- The project generates fictional mysteries; it is not a real-world investigation tool.
- Generated mysteries must be validated before being saved.
- The solution and culprit must remain on the backend until the player submits an accusation.
- Scoring and validation must be performed by the backend.
- The project depends on the configured Gemini API, MongoDB connection, and hosting services.
- API failures and invalid AI responses must be handled safely.
- No authentication or multi-user account system is required by the supplied guide; do not treat it as a core requirement unless added later.

### 1.8 Final Deliverables
- A complete `SPEC.md`.
- Complete project source code in a GitHub repository.
- A deployed live website URL.
- A successful mystery-solving demonstration on the deployed website.
- Submission through: https://bit.ly/ai-mystery-room-sub-form

**Deadline stated in the guide:** 2 November, 11:59 PM.

---

## 2. Functional Requirements

### FR-01: Create a Mystery
- The user can enter a mystery premise.
- The user can choose `Easy`, `Medium`, or `Hard`.
- The frontend submits the premise and difficulty to the backend.
- The backend validates the request, asks Gemini to generate structured mystery data, validates the response, and stores the case.
- The backend response must not expose the culprit or solution.

### FR-02: View an Active Case
- The user can view the case title, story, difficulty, suspects, available clues, hints/progress information, and investigation status.
- The case can be retrieved by its identifier.
- Only player-safe case data is returned before an accusation.

### FR-03: Discover a Clue
- The user can choose an undiscovered clue.
- The frontend sends a discover request to the backend.
- The backend verifies the case and clue, records discovery, and updates progress.
- The clue's content is revealed only after successful discovery.
- Repeated discovery requests must not award duplicate clue points.

### FR-04: Request a Hint
- The user can request a hint for an active case.
- The backend checks that a hint remains available, records its use, and returns the next hint.
- Each hint used incurs a 10-point penalty.
- The number of hints available depends on difficulty.

### FR-05: Submit an Accusation
- The player selects a suspect and submits the accusation.
- The backend validates the suspect identifier and ensures the case has not already been completed.
- The backend compares the accusation with the privately stored culprit.
- The result is finalized and the score is calculated on the backend.
- The completed result reveals the verdict, culprit, explanation, and score.

### FR-06: View Results
- The user can retrieve the result of a completed case.
- The results page displays the verdict, correct culprit, explanation, and final score.
- The player can start a new mystery.

### FR-07: Error and Loading States
- The interface shows loading feedback while a mystery is generated or an action is processed.
- Invalid input, unavailable cases, exhausted hints, invalid AI output, network errors, and server errors show understandable messages.
- A failed request must not falsely mark a clue as discovered, consume a hint, or complete a case.

---

## 3. Difficulty Rules and Game Configuration

| Difficulty | Suspects | Clues | Hints | Base points for correct accusation |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

### 3.1 Scoring Rules
- Correct accusation: award the difficulty's base points.
- Each uniquely discovered clue: **+5 points**.
- Each hint used: **−10 points**.
- Minimum final score: **0**.
- The backend is the sole authority for score calculation.

### 3.2 Score Formula
For a correct accusation:

`score = max(0, basePoints + (uniqueDiscoveredClues × 5) - (hintsUsed × 10))`

For an incorrect accusation, the guide does not specify a base score or an incorrect-accusation penalty. Do not invent a penalty. The implementation must document its behavior explicitly; recommended default is **0 points for an incorrect accusation**, with clue and hint adjustments not allowing a negative result. Keep this rule isolated in the backend so it can be changed if the project owner clarifies the intended behavior.

### 3.3 Difficulty Validation
Only these exact difficulty values are accepted:
- `easy`
- `medium`
- `hard`

The frontend may display capitalized labels. The backend validates the value and determines the expected suspect, clue, and hint counts.

---

## 4. User Flow

1. User opens the Home page.
2. User selects **Start Mystery**.
3. User enters a premise and selects a difficulty on Create Mystery.
4. User submits the form.
5. The frontend shows a loading state while the backend requests a mystery from Gemini.
6. The backend validates the generated structure and stores the case.
7. The user is redirected to the Investigation Room.
8. The user reads the story and suspect cards.
9. The user discovers clues; each successful unique discovery updates progress and score preview if displayed.
10. The user may request hints while hints remain.
11. The user opens the Accusation interface, selects a suspect, and confirms.
12. The backend finalizes the accusation and score.
13. The Results page displays the verdict, culprit, explanation, and score.
14. The user selects **Start Another Mystery** to return to Create Mystery or Home.

---

## 5. UI and Page Specifications

### 5.1 Global Layout
- Responsive design for mobile, tablet, and desktop.
- Clear navigation and readable typography.
- Consistent buttons, form controls, cards, status messages, and spacing.
- Show loading, empty, success, and error states where relevant.
- Do not expose private solution data in client-side page state or API responses before the accusation is submitted.

### 5.2 Home Page (`/`)
**Purpose:** Introduce the project and let the user begin.

**Required elements:**
- Project title: AI Mystery Room.
- Short project introduction.
- Primary **Start Mystery** button.
- Brief explanation of the mystery-solving process.

**Behavior:**
- Start Mystery navigates to `/create`.

### 5.3 Create Mystery Page (`/create`)
**Purpose:** Collect the premise and difficulty.

**Required elements:**
- Mystery premise text area.
- Difficulty selector: Easy, Medium, Hard.
- Submit / Generate Mystery button.
- Input validation and helpful error text.

**Behavior:**
- Reject an empty or whitespace-only premise.
- Apply a reasonable maximum premise length (recommended: 1,000 characters).
- Disable duplicate submissions while generation is in progress.
- On success, navigate to `/investigation/:id`.
- On failure, remain on the page and show a retryable error.

### 5.4 Investigation Room (`/investigation/:id`)
**Purpose:** Let the player explore the mystery.

**Required elements:**
- Mystery title, story, and difficulty.
- Suspect cards with names and public descriptions.
- Clue list with discovered / undiscovered state.
- Discover-clue actions.
- Request-hint action and hint history.
- Investigation progress indicator.
- Accusation action.
- Loading and error feedback.

**Behavior:**
- Only reveal clue content after discovery.
- Display each clue as discovered only after backend confirmation.
- Disable hint requests when no hints remain.
- Provide a way to proceed to accusation.
- Do not include the culprit, solution, or hidden answer in the page payload.

### 5.5 Accusation Page or Panel (`/investigation/:id/accuse`)
**Purpose:** Capture the player's final suspect selection.

**Required elements:**
- List of suspects selectable by the player.
- Selected-suspect state.
- Submit accusation button.
- Confirmation prompt to reduce accidental submissions.
- Loading and error feedback.

**Behavior:**
- Require a selected suspect.
- Submit the suspect ID to the backend.
- Prevent duplicate submissions.
- After successful completion, navigate to `/results/:id`.

### 5.6 Results Page (`/results/:id`)
**Purpose:** Show the final outcome.

**Required elements:**
- Verdict (correct or incorrect).
- Correct culprit.
- Explanation of the solution and how clues support it.
- Final score.
- Number of clues discovered and hints used.
- Start Another Mystery button.

**Behavior:**
- Results can only be returned after the case is completed.
- If a case is still active, do not reveal its solution; return the user to investigation or show a safe message.
- Start Another Mystery navigates to `/create`.

### 5.7 Shared UI States
- **Loading:** Explain the action in progress; prevent accidental duplicate submissions.
- **Validation error:** Identify the field or action that needs attention.
- **Not found:** Show a friendly message for unknown case IDs.
- **API failure:** Explain that the request failed and allow retry where safe.
- **Completed case:** Prevent additional clue, hint, or accusation mutations.
- **Responsive behavior:** Keep controls usable on small screens and ensure cards and text reflow without horizontal overflow.

---

## 6. Backend Architecture and API Design

### 6.1 Architecture
- React/Vite frontend sends HTTP requests using Axios.
- Express backend validates requests and owns game rules.
- Mongoose persists case data in MongoDB.
- Gemini is called only from the backend.
- Zod validates incoming requests and generated AI data.
- Environment variables configure secrets and service URLs.

### 6.2 API Conventions
- Base path: `/api`.
- JSON request and response bodies.
- Use appropriate HTTP status codes.
- All error responses use a consistent shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

- Never return the private culprit, solution, or solution explanation from active-case endpoints.
- Never trust client-submitted scores, hint counts, clue counts, culprit IDs, or completion status.

### 6.3 `POST /api/cases` — Generate a Mystery
**Request:**
```json
{
  "premise": "A valuable necklace disappears during a dinner party.",
  "difficulty": "easy"
}
```

**Success response (`201 Created`):**
```json
{
  "case": {
    "id": "case_id",
    "title": "The Missing Necklace",
    "story": "Public story text...",
    "difficulty": "easy",
    "suspects": [
      {
        "id": "suspect_1",
        "name": "Alex",
        "description": "Public suspect description..."
      }
    ],
    "clues": [
      {
        "id": "clue_1",
        "label": "A mark near the window",
        "discovered": false,
        "content": null
      }
    ],
    "hintsRemaining": 2,
    "discoveredClueCount": 0,
    "status": "active"
  }
}
```

The example is illustrative; actual suspect, clue, and hint counts must match the chosen difficulty. `content` is `null` until discovered. Do not include solution fields.

### 6.4 `GET /api/cases/:id` — Retrieve an Active Mystery
Returns the safe public case representation, clue discovery states, hint usage/progress, and status.

- `200 OK` when found.
- `404 Not Found` when the case does not exist.
- If completed, this endpoint may return only safe case data; solution details are returned by the result endpoint.

### 6.5 `POST /api/cases/:id/clues/:clueId/discover` — Discover a Clue
**Request:** No body required.

**Success response (`200 OK`):**
```json
{
  "clue": {
    "id": "clue_1",
    "label": "A mark near the window",
    "content": "The discovered clue text..."
  },
  "discoveredClueCount": 1,
  "scorePreview": 5
}
```

Rules:
- Verify that the case is active and the clue belongs to it.
- Record discovery only once.
- Award +5 points only for the first successful discovery.
- Do not return clue content before successful discovery.
- `scorePreview` is informational only; final scoring happens on the backend.

### 6.6 `POST /api/cases/:id/hints` — Request a Hint
**Request:** No body required.

**Success response (`200 OK`):**
```json
{
  "hint": {
    "number": 1,
    "content": "Compare the timeline with the evidence."
  },
  "hintsUsed": 1,
  "hintsRemaining": 1
}
```

Rules:
- Return one hint per successful request.
- Record hint use on the backend.
- Apply a 10-point deduction per hint used during final scoring.
- If no hints remain, return `409 Conflict` with `HINTS_EXHAUSTED`.
- Do not expose the culprit or full solution in a hint.

### 6.7 `POST /api/cases/:id/accuse` — Submit an Accusation
**Request:**
```json
{
  "suspectId": "suspect_2"
}
```

**Success response (`200 OK`):**
```json
{
  "result": {
    "correct": false,
    "verdict": "Incorrect",
    "score": 0,
    "completedAt": "ISO-8601 timestamp"
  }
}
```

Rules:
- Validate that `suspectId` belongs to the case.
- Compare the suspect ID against the server-stored culprit ID.
- Calculate and persist the score on the backend.
- Mark the case completed and prevent further clue discovery, hint use, or accusations.
- Do not accept a score from the client.
- Return the verdict and score. The full culprit and explanation are returned by the result endpoint after completion.

### 6.8 `GET /api/cases/:id/result` — Retrieve the Completed Result
**Success response (`200 OK`):**
```json
{
  "result": {
    "correct": true,
    "verdict": "Correct",
    "culprit": {
      "id": "suspect_2",
      "name": "Alex"
    },
    "explanation": "The solution explanation...",
    "score": 155,
    "discoveredClueCount": 3,
    "hintsUsed": 1,
    "completedAt": "ISO-8601 timestamp"
  }
}
```

Rules:
- Return solution details only when the case has been completed.
- If the case is active, return `409 Conflict` with `CASE_NOT_COMPLETED`.
- If the case does not exist, return `404 Not Found`.

### 6.9 Suggested Additional Operational Endpoints
The supplied guide does not require health or status endpoints. An optional `GET /api/health` may be added for deployment checks, but it must not replace any required endpoint.

---

## 7. Database Design

### 7.1 MongoDB Collection
Use a Mongoose `Case` model. Store each mystery and its player progress in one case document for the initial implementation.

### 7.2 Case Document Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | String | Yes | Mystery title |
| `premise` | String | Yes | User-provided premise |
| `story` | String | Yes | Public story |
| `difficulty` | String enum | Yes | `easy`, `medium`, or `hard` |
| `suspects` | Array of objects | Yes | Suspect ID, name, public description |
| `clues` | Array of objects | Yes | Clue ID, label, content, discovered state/time |
| `hints` | Array of strings/objects | Yes | Generated hints |
| `culpritId` | String | Yes | Private correct suspect ID |
| `solutionExplanation` | String | Yes | Private explanation until completion |
| `discoveredClueIds` | Array of strings | Yes | Unique discovered clue IDs |
| `hintsUsed` | Number | Yes | Number of hints already used |
| `accusationSuspectId` | String/null | Yes | Final accusation, if submitted |
| `score` | Number/null | Yes | Final score after accusation |
| `status` | String enum | Yes | `active` or `completed` |
| `createdAt` | Date | Yes | Creation timestamp |
| `completedAt` | Date/null | Yes | Completion timestamp |

Use Mongoose timestamps or explicit timestamps. Validate all nested fields. Use unique IDs for suspects and clues within each case.

### 7.3 Data Privacy and Safe Serialization
- Keep `culpritId` and `solutionExplanation` in the database but exclude them from active-case API responses.
- Prefer explicit response DTO/serializer functions that whitelist public fields.
- Do not serialize a raw Mongoose document directly to the client.
- Return private solution fields only from the completed result endpoint.
- Do not put the Gemini API key in frontend environment variables or source control.

---

## 8. AI Behavior and Gemini Integration

### 8.1 Generation Input
Send Gemini:
- User's premise.
- Selected difficulty.
- Exact required suspect, clue, and hint counts.
- A requirement that the solution be logically consistent and supported by clues.
- A requirement to return structured JSON matching the expected schema.

### 8.2 Required AI Output Shape
The backend should expect an object with these fields:

```json
{
  "title": "The Missing Necklace",
  "story": "The public mystery story...",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Alex",
      "description": "A public description without revealing guilt."
    }
  ],
  "clues": [
    {
      "id": "clue_1",
      "label": "A mark near the window",
      "content": "The clue evidence shown after discovery."
    }
  ],
  "hints": [
    "Hint that guides reasoning without naming the culprit."
  ],
  "culpritId": "suspect_2",
  "solutionExplanation": "A coherent explanation supported by the clues."
}
```

### 8.3 Difficulty Counts
The backend must validate exact counts before saving:
- Easy: 3 suspects, 5 clues, 2 hints.
- Medium: 4 suspects, 7 clues, 3 hints.
- Hard: 5 suspects, 9 clues, 3 hints.

### 8.4 Validation Requirements
Use Zod to validate:
- Required fields and correct types.
- Non-empty title, story, names, descriptions, clue labels/content, hints, and explanation.
- Unique suspect IDs and clue IDs.
- `culpritId` matches one of the generated suspects.
- Exact counts for the selected difficulty.
- No malformed or incomplete JSON.

If Gemini output is invalid:
- Do not save the case.
- Return a safe server error.
- Optionally retry generation a limited number of times.
- Do not silently fill in missing suspects, clues, hints, or solution fields.

### 8.5 Mystery Consistency
- Exactly one generated suspect should be designated as the culprit.
- The solution explanation must identify how the evidence supports the culprit.
- Clues should not directly contradict the solution.
- Hints should guide the player without directly disclosing the culprit.
- Public story, suspect descriptions, and unrevealed clue labels must not reveal the solution prematurely.
- Backend scoring must use the stored solution, never a new AI judgment at accusation time.

### 8.6 API Key and Failure Handling
- Call Gemini only from the backend.
- Store `GEMINI_API_KEY` in server environment variables.
- Handle quota, timeout, network, malformed response, and provider errors.
- Log technical diagnostics server-side without returning secrets or sensitive provider details to the client.

---

## 9. Security, Validation, and Error Handling

### 9.1 Security Requirements
- Never expose the culprit or solution before accusation submission.
- Never expose Gemini API keys or MongoDB credentials to the frontend.
- Never trust client-provided scores or progress counters.
- Validate route parameters, request bodies, IDs, and difficulty.
- Use CORS configured for the deployed frontend origin.
- Use environment variables for secrets.
- Do not commit `.env` files to GitHub; include `.env.example` with placeholders only.

### 9.2 Error Codes
Use a consistent error response for at least these cases:

| HTTP status | Error code | Meaning |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Invalid premise, difficulty, or request data |
| `404` | `CASE_NOT_FOUND` | Unknown case ID |
| `404` | `CLUE_NOT_FOUND` | Clue does not belong to the case |
| `409` | `HINTS_EXHAUSTED` | No hints remain |
| `409` | `CASE_NOT_ACTIVE` | Case already completed |
| `409` | `CASE_NOT_COMPLETED` | Result requested before accusation |
| `502` | `AI_GENERATION_FAILED` | Gemini unavailable or generated invalid output |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error |

### 9.3 Safe Mutation Rules
- A clue is marked discovered only after the backend accepts the request.
- A hint is consumed only when a hint is successfully returned.
- An accusation can complete a case only once.
- Repeated clue-discovery requests must not grant additional points.
- Completed cases are read-only for gameplay mutations.

---

## 10. Environment and Project Setup

### 10.1 Suggested Folder Structure

```text
ai-mystery-room/
├── SPEC.md
├── README.md
├── .gitignore
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── .env.example
└── server/
    ├── src/
    │   ├── config/
    │   ├── models/
    │   ├── routes/
    │   ├── controllers/
    │   ├── services/
    │   ├── validators/
    │   ├── middleware/
    │   └── app.js
    ├── server.js
    ├── package.json
    └── .env.example
```

### 10.2 Frontend Setup
```bash
npm create vite@latest client -- --template react
cd client
npm install
npm install react-router-dom axios
```

Install and configure Tailwind CSS using the current setup instructions appropriate to the chosen Tailwind version.

### 10.3 Backend Setup
```bash
mkdir server
cd server
npm init -y
npm install express cors dotenv mongoose @google/genai zod
npm install --save-dev nodemon
```

### 10.4 Backend Environment Variables
Create `server/.env` locally:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

Never commit actual credentials. Commit a `.env.example` containing placeholder values only.

### 10.5 Frontend Environment
Use a public API base URL variable, such as:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Only public configuration belongs in frontend variables. Never put `GEMINI_API_KEY` or `MONGODB_URI` in the frontend.

---

## 11. Testing Plan

### 11.1 Functional Tests
- Generate an Easy mystery and verify 3 suspects, 5 clues, and 2 hints.
- Generate a Medium mystery and verify 4 suspects, 7 clues, and 3 hints.
- Generate a Hard mystery and verify 5 suspects, 9 clues, and 3 hints.
- Discover a clue and verify its content is revealed.
- Discover the same clue twice and verify points are awarded only once.
- Request hints and verify the available count decreases correctly.
- Exhaust hints and verify a clear error response.
- Submit the correct suspect and verify a correct verdict and backend-calculated score.
- Submit an incorrect suspect and verify an incorrect verdict and the documented score behavior.
- Request results before accusation and verify the solution is not revealed.
- Try to mutate a completed case and verify the server rejects the request.

### 11.2 Validation and Failure Tests
- Submit an empty premise.
- Submit an invalid difficulty.
- Submit an invalid case ID or clue ID.
- Simulate a Gemini API failure.
- Simulate malformed Gemini JSON or incorrect item counts.
- Simulate a MongoDB connection failure.
- Simulate a frontend network failure.
- Verify no private solution data is included in active-case responses.
- Verify `.env` secrets are not committed or exposed in frontend bundles.

### 11.3 Acceptance Criteria Checklist
- [ ] Users can generate mysteries at all three difficulty levels.
- [ ] Each difficulty has the specified number of suspects, clues, and hints.
- [ ] Players can investigate and discover clues.
- [ ] Players can request hints while available.
- [ ] Players can submit an accusation.
- [ ] The solution is not revealed prematurely.
- [ ] Scores are calculated and validated by the backend.
- [ ] Results display the correct culprit and explanation.
- [ ] Invalid AI responses are handled safely.
- [ ] API failures are handled gracefully.
- [ ] The application works on the deployed website.
- [ ] A complete mystery can be created and solved on the live deployment.

---

## 12. Deployment Plan

### 12.1 Database
- Create a MongoDB Atlas cluster.
- Configure database access credentials and network access.
- Set the production `MONGODB_URI` as a backend environment variable.
- Do not place database credentials in the frontend.

### 12.2 Backend
- Deploy the Express application to a suitable hosting provider.
- Configure `PORT`, `MONGODB_URI`, `GEMINI_API_KEY`, and `CLIENT_URL`.
- Configure CORS to allow the deployed frontend.
- Verify the backend can connect to MongoDB and Gemini.

### 12.3 Frontend
- Deploy the React/Vite application to Vercel.
- Set `VITE_API_BASE_URL` to the deployed backend's API URL.
- Verify all frontend routes and API requests work in production.

### 12.4 Production Verification
- Create a mystery at each difficulty.
- Discover clues and request hints.
- Submit an accusation.
- Verify the verdict, explanation, and score.
- Confirm the solution is not exposed before accusation.
- Confirm the application handles failures gracefully.

---

## 13. Final Submission Checklist

- [ ] Finalize `SPEC.md`.
- [ ] Build the application according to this specification.
- [ ] Test all difficulty levels and the complete gameplay flow.
- [ ] Verify backend-controlled scoring and solution privacy.
- [ ] Deploy the backend.
- [ ] Configure MongoDB Atlas.
- [ ] Deploy the frontend to Vercel.
- [ ] Create and solve a mystery on the deployed website.
- [ ] Publish the complete source code in a GitHub repository.
- [ ] Submit the GitHub repository and live website URL using the project submission form: https://bit.ly/ai-mystery-room-sub-form

**Project deadline stated in the guide:** 2 November, 11:59 PM.

---

## 14. Implementation Notes and Explicit Decisions

The following details are not fully defined by the supplied guide and should be kept configurable or documented during implementation:

1. **Incorrect-accusation score:** The guide specifies base points for a correct accusation but does not explicitly define the score for an incorrect accusation. The recommended default in this specification is 0 points.
2. **Premise length:** A 1,000-character limit is a practical implementation default, not a number specified in the guide.
3. **Case access:** The guide does not specify authentication or ownership. The initial version may use unguessable case IDs and omit accounts, but this is not equivalent to a full authorization system.
4. **Retry policy:** A limited retry for invalid Gemini output is optional; the retry count should be configured and bounded.
5. **AI consistency:** Schema validation checks structure, not whether the mystery is logically solvable. Include manual or automated scenario tests and review generated cases during development.

These decisions must not weaken the required rules: backend-only solution storage in API behavior, backend-controlled scoring, exact difficulty counts, and a complete deployed game flow.
