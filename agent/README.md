# agent

Generated with `uvx vision-agents init`. See the docs at <https://visionagents.ai>.

## Setup

1. Copy `.env.example` to `.env` and fill in the keys.
2. Install dependencies:

   ```bash
   uv sync
   ```

3. Run the agent:

   ```bash
   uv run agent.py run     # single-call console
   uv run agent.py serve   # HTTP server
   ```

4. Run the tests:

   ```bash
   uv run pytest
   ```

## Docker

```bash
docker build -t agent .
docker run --env-file .env -p 8000:8000 agent
```

## How this connects to the Skyscanner app

This is a separate service from the Expo app in `../src` — different
language, its own `.env`, its own deploy target. It never runs inside the
Expo/Metro process.

For local dev, run **both** at once, in separate terminals:

```bash
# terminal 1 — this service
cd agent && uv run agent.py serve --host 0.0.0.0 --port 8000

# terminal 2 — the Expo app
cd .. && npx expo run:ios
```

The app's own `.env` has `VISION_AGENT_URL=http://localhost:8000` pointing
at this server. When a user taps the mic on the trip-assistant screen, the
Expo API route `src/app/api/assistant-call+api.ts` calls
`POST /calls/{call_id}/sessions` here to have this agent join the same
Stream call — `call_id` is always `assistant-<clerk_user_id>` (one personal
room per signed-in user; see `assistantCallId()` in `src/lib/stream.ts`).

`agent.py`'s `STREAM_API_KEY`/`STREAM_API_SECRET` must be the **same Stream
app** as the Expo app's — otherwise the agent and the human end up trying to
join calls in two different Stream projects and never actually meet.
