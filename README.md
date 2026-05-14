# PlainTalk 🗣️

**A translation layer that simplifies technical jargon and rewrites complex instructions into plain language — built for dementia patients and their carers.**

Built for the Dementia Hackathon — PLAINTALK Challenge.

---

## How to Run

1. Open the `plaintalk` folder in VS Code
2. Install the **Live Server** extension (if not already installed)
3. Right-click `index.html` → **Open with Live Server**
4. Or simply open `index.html` directly in your browser

**Pages:**
- `index.html` — **Patient View** (what the patient sees)
- `admin.html` — **Carer Dashboard** (what the carer manages)

> Both pages communicate via `localStorage`, so they must run on the same origin (same browser).

---

## Features

### Patient View (`index.html`)
- **4 main icons**: Music, Photos, Activity, Reading
- **Light/Dark mode toggle** (top-right sun/moon button)
- **Light mode**: Warm, soft colours — Reading shows simplified newspaper articles
- **Dark mode**: Calming dark blue — Reading shows children's stories (ages 3–6)
- **Reminder popups**: Appear at scheduled times set by the carer, with friendly icons and a "Done!" button
- **Floating call button**: One-tap emergency contact call
- **Accessible design**: Large icons, simple labels, minimal text, high contrast

### Carer Dashboard (`admin.html`)
- **Reminders**: Add time-based reminders — see completion status
- **Music**: Pick from 3 song options for the patient
- **Reading (AI-Powered)**:
  - **Newspapers (Day)**: Paste any article → AI simplifies it into plain English via OpenAI API
  - **Stories (Night)**: Add simple children's stories for bedtime reading
- **Album**: Add photo URLs for the patient to browse
- **Activity**: Write step-by-step activity instructions (e.g., painting)
- **Patient Info**: Record patient details + view app usage stats (for research)
- **Settings**: Set patient name + emergency contact number

---

## AI Text Simplification (OpenAI)

The key feature is **AI-powered text simplification**:

1. Go to the **Carer Dashboard** → **Reading** section
2. Enter your **OpenAI API key** (stored locally, never sent anywhere else)
3. Paste any newspaper article
4. Click **"Simplify & Add"** — the AI rewrites it in plain, short sentences
5. The simplified version appears on the patient's screen under "News"

**Model used**: `gpt-4o-mini` (fast, affordable, great at simplification)

---

## Tech Stack

- **HTML / CSS / JavaScript** — no frameworks, no build step
- **OpenAI API** — for text simplification (requires API key)
- **localStorage** — for data persistence between admin and patient views
- **Google Fonts** — Nunito + Quicksand for warmth and readability

---

## Example User

**Eileen, 80** — An avid reader who now finds dense digital text tiring and confusing. She is hesitant to continue if instructions feel unclear.

PlainTalk converts complex news articles into simple, short sentences she can read comfortably. At night, it switches to calming bedtime stories. Her carer controls everything — Eileen just sees friendly icons and clear text.
