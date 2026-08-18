# Soul Search: Blueprint & Architecture

## Overview
"Soul Search" is a core feature of InspireMyFaith designed to provide emotional regulation. It allows users to express chaotic emotions or situations and receive structured spiritual guidance and relevant scripture.

## The Self-Building Hybrid Architecture

Our goal is to build a massive, highly accurate database of human emotions mapped to scripture, without incurring ongoing API costs. We will achieve this through a "Self-Building" loop.

### How the Self-Building Loop Works:

1. **Local First (Cost: $0):**
   - When a user submits a journal entry or searches for a feeling, the system *first* checks our local MySQL database.
   - We extract keywords from the user's input and query our `topics` and `verse_topics` tables.
   - If we have a strong match (e.g., they mentioned "anxious" and we have many verses for that), we return the results immediately from the local database.

2. **The Free API Fallback (The Learning Phase):**
   - If the local database *fails* to find a good match (a "miss" or "low confidence" result), the system silently routes the user's input to a free-tier AI API (like Gemini's free tier, up to limits).
   - The AI is prompted to return the best KJV verses for the user's specific situation, along with the core "topic" or "emotion" keywords it identified.

3. **The Harvesting Engine (Database Growth):**
   - Before returning the AI's response to the user, our backend *intercepts* the data.
   - We automatically insert the new keywords/topic into our `topics` table and link the AI-recommended verses into the `verse_topics` table.
   - The user gets their comforting response, and our database just got smarter.

4. **The Circuit Breaker (Cost Protection):**
   - If the free API tier runs out of credits or rate limits are hit, the "Circuit Breaker" trips.
   - The system falls back to a generic, loving message with general comforting verses from the local database, ensuring the app *never* breaks and *never* incurs a surprise bill.

### Why This is Powerful:
- **Snowball Effect:** Every unique user search makes the local database stronger. Over time, the local database will be so comprehensive that it will rarely need to call the AI API.
- **100% Free to Run:** The API is only used to "fill the gaps" in our knowledge, keeping usage well within free-tier limits.

## Action Plan (Next Steps for Implementation)

1. **Database Expansion:**
   - Ensure the `topics` and `verse_topics` tables can handle dynamically inserted AI keywords.
2. **AI Integration (Free Tier):**
   - Integrate the Gemini API in the backend.
   - Write a strict system prompt ensuring the AI only returns KJV verses and structured JSON (Topic, Keywords, Verses).
3. **The Routing Logic (Server-Side):**
   - Implement the "Local First -> API Fallback -> Harvest -> Return" logic in `server.ts`.
4. **The Circuit Breaker:**
   - Add error catching so that if the API throws a 429 (Too Many Requests), the app gracefully serves local default verses instead of crashing.
