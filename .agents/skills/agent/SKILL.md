---
name: Agent
description: Use when building real-time voice and video AI agents, deploying conversational systems with phone/web integration, adding function calling and RAG to agents, or implementing computer vision processors. Reach for this skill when working with agent configuration, deployment, integrations, event handling, and testing.
metadata:
    mintlify-proj: agent
    version: "1.0"
---

# Vision Agents Skill

## Product Summary

Vision Agents is an open-source Python framework for building real-time voice and video AI agents. You write an `Agent` that joins a session, connects to AI providers through swappable plugins (LLM, STT, TTS, vision models), and responds in real time. The framework handles call lifecycle, audio/video routing, turn-taking, and deployment. Key files: `agent.py` (agent definition), `.env` (API keys), `pyproject.toml` (dependencies). CLI: `uv run agent.py run` (console mode), `uv run agent.py serve` (HTTP server). Integrations: 35+ providers across LLMs, speech, vision, avatars, and telephony. Primary docs: https://visionagents.ai

## When to Use

Reach for this skill when:
- Building voice agents with realtime models (Gemini, OpenAI, Qwen) or custom STT/LLM/TTS pipelines
- Deploying agents to production (Docker, Kubernetes, HTTP server with session management)
- Adding function calling, MCP servers, or RAG (Gemini FileSearch, TurboPuffer) to agents
- Integrating phone calls (Twilio, Telnyx) or video processing (YOLO, VLMs, avatars)
- Configuring turn detection, interruption handling, or multi-speaker audio routing
- Testing agents with pytest without spinning up audio/video infrastructure
- Monitoring agents with OpenTelemetry metrics and event subscriptions
- Swapping AI providers (LLM, STT, TTS, vision) without rewriting agent logic

## Quick Reference

### Agent Modes

| Mode | Best For | Setup |
|------|----------|-------|
| **Realtime** | Lowest latency, native video | `llm=gemini.Realtime()` — one provider handles speech in/out |
| **Custom Pipeline** | Full control, mixed providers | `llm=gemini.LLM()`, `stt=deepgram.STT()`, `tts=elevenlabs.TTS()` |
| **Video (VLM)** | Frame analysis, video understanding | `llm=nvidia.VLM(fps=1, frame_buffer_seconds=10)` |
| **Video (Processor)** | Object detection, pose estimation | `processors=[ultralytics.YOLOPoseProcessor(...)]` |

### Core Agent Constructor

```python
Agent(
    edge=getstream.Edge(),                    # Transport layer
    agent_user=User(name="...", id="agent"),  # Agent identity
    instructions="...",                        # System prompt
    llm=gemini.Realtime(),                    # LLM (realtime or standard)
    stt=deepgram.STT(),                       # Speech-to-text (optional in realtime)
    tts=elevenlabs.TTS(),                     # Text-to-speech (optional in realtime)
    turn_detection=smart_turn.TurnDetector(), # Turn detection (optional)
    processors=[...],                         # Video processors (optional)
    avatar=anam.Avatar(...),                  # Avatar (optional)
    mcp_servers=[...],                        # MCP servers for tools (optional)
)
```

### Essential Methods

| Method | Purpose |
|--------|---------|
| `await agent.create_call(call_type, call_id)` | Create a call on the edge provider |
| `async with agent.join(call):` | Join call as context manager (required) |
| `await agent.simple_response(text, interrupt=True)` | Send text to LLM, speak response |
| `await agent.say(text, interrupt=False)` | Speak text directly (bypass LLM) |
| `await agent.finish()` | Wait for call to end gracefully |
| `await agent.close()` | Clean up resources (called automatically) |
| `@agent.events.subscribe` | Subscribe to events (participant joins, transcripts, errors) |
| `@llm.register_function(description="...")` | Register tool for function calling |

### Deployment Commands

```bash
# Console mode (development)
uv run agent.py run

# HTTP server (production)
uv run agent.py serve --host 0.0.0.0 --port 8000

# Docker
docker build -t my-agent .
docker run -e GOOGLE_API_KEY=... my-agent

# Kubernetes (with Helm)
helm install my-agent ./helm-chart
```

### HTTP Server Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/calls/{call_id}/sessions` | Start agent session |
| DELETE | `/calls/{call_id}/sessions/{session_id}` | Close session |
| GET | `/calls/{call_id}/sessions/{session_id}/metrics` | Get performance metrics |
| GET | `/health` | Liveness check |
| GET | `/ready` | Readiness check |

### Plugin Installation

```bash
# Add plugins as extras
uv add "vision-agents[deepgram,elevenlabs,gemini]"

# Or explicit packages
uv add vision-agents-plugins-deepgram vision-agents-plugins-elevenlabs
```

## Decision Guidance

### When to Use Realtime vs Custom Pipeline

| Scenario | Use Realtime | Use Custom Pipeline |
|----------|--------------|---------------------|
| Fastest time to market, lowest latency | ✓ | |
| Need specific STT provider (e.g., Deepgram with eager turn detection) | | ✓ |
| Want to mix LLM, STT, TTS from different providers | | ✓ |
| Need function calling with full control | | ✓ |
| Building video agent with native vision support | ✓ | |
| Prototyping quickly | ✓ | |

### When to Use Gemini FileSearch vs TurboPuffer for RAG

| Factor | Gemini FileSearch | TurboPuffer |
|--------|-------------------|------------|
| Setup complexity | Simple | More setup |
| Chunking | Automatic | Configurable |
| Search type | Managed | Hybrid (vector + BM25) |
| Control level | Less | Full |
| Cost | Included with Gemini | Separate service |
| Best for | Prototypes | Production with custom needs |

### When to Use HTTP Server vs Console Mode

| Use Case | Console Mode | HTTP Server |
|----------|--------------|------------|
| Local development | ✓ | |
| Testing with browser demo | ✓ | |
| Production deployment | | ✓ |
| Multiple concurrent agents | | ✓ |
| Session management, scaling | | ✓ |

## Workflow

### 1. Build a New Agent

1. **Scaffold the project:**
   ```bash
   uvx vision-agents init my-agent && cd my-agent
   ```

2. **Add API keys to `.env`:**
   ```bash
   cp .env.example .env
   # Fill in: STREAM_API_KEY, STREAM_API_SECRET, GOOGLE_API_KEY, etc.
   ```

3. **Review `agent.py`** — understand the three parts:
   - `create_agent()` — builds the Agent with plugins
   - `join_call()` — defines what happens when agent joins
   - `runner` — CLI entry point

4. **Customize instructions and plugins** in `create_agent()`:
   ```python
   async def create_agent(**kwargs) -> Agent:
       return Agent(
           edge=getstream.Edge(),
           agent_user=User(name="My Assistant", id="agent"),
           instructions="You're a helpful voice assistant.",
           llm=gemini.Realtime(),  # or custom pipeline
       )
   ```

5. **Run locally:**
   ```bash
   uv run agent.py run
   ```
   Open the browser link to test.

### 2. Add Function Calling

1. **Register functions on the LLM:**
   ```python
   llm = gemini.LLM()  # Not Realtime
   
   @llm.register_function(description="Get weather for a location")
   async def get_weather(location: str) -> dict:
       return {"temp": "22C", "condition": "Sunny"}
   ```

2. **Pass the LLM to Agent:**
   ```python
   agent = Agent(
       edge=getstream.Edge(),
       llm=llm,
       stt=deepgram.STT(),
       tts=elevenlabs.TTS(),
   )
   ```

3. **LLM calls functions automatically** during conversation.

### 3. Add RAG (Knowledge Base)

1. **Choose a provider:**
   - **Gemini FileSearch** (simple): `await store.add_directory("./docs")`
   - **TurboPuffer** (full control): `await rag.add_directory("./docs")`

2. **Register as function:**
   ```python
   @llm.register_function(description="Search knowledge base")
   async def search_docs(query: str) -> str:
       return await rag.search(query, top_k=5)
   ```

3. **Agent calls it when relevant.**

### 4. Deploy to Production

1. **Run HTTP server locally first:**
   ```bash
   uv run agent.py serve --host 0.0.0.0 --port 8000
   ```

2. **Containerize with Docker:**
   - Use the scaffolded `Dockerfile`
   - Build: `docker build -t my-agent .`
   - Run: `docker run -e GOOGLE_API_KEY=... my-agent`

3. **Scale horizontally (multiple replicas):**
   - Add Redis for session registry (see Horizontal Scaling guide)
   - Deploy multiple containers behind a load balancer

4. **Orchestrate with Kubernetes:**
   - Use the Helm chart from examples
   - Configure health probes, resource limits, metrics

5. **Monitor with OpenTelemetry:**
   - Export metrics to Prometheus
   - View dashboards in Grafana

### 5. Test Agents

1. **Use `TestSession` for text-only testing:**
   ```python
   from vision_agents.testing import TestSession, LLMJudge
   
   async def test_greeting():
       llm = gemini.LLM()
       async with TestSession(llm=llm, instructions="Be friendly") as session:
           response = await session.simple_response("Hello")
           assert response.function_calls == []
   ```

2. **Mock functions for call tracking:**
   ```python
   async def fake_weather(**_) -> dict:
       return {"temp": 55}
   
   with session.mock_functions({"get_weather": fake_weather}) as mocked:
       response = await session.simple_response("Weather?")
       mocked["get_weather"].assert_called_once()
   ```

3. **Use LLMJudge to evaluate intent:**
   ```python
   judge = LLMJudge(gemini.LLM())
   verdict = await judge.evaluate(response.chat_messages[0], intent="Friendly greeting")
   assert verdict.success
   ```

## Common Gotchas

- **Don't reuse Agent instances.** Create a new agent for each call. Calling `join()` twice raises `RuntimeError`.
- **Realtime LLMs disable STT/TTS.** When using `llm=gemini.Realtime()`, don't pass `stt` or `tts` — they're ignored with a warning.
- **Turn detection conflicts.** Don't use `turn_detection` with Realtime LLMs (they handle it internally). If STT has built-in turn detection (e.g., Deepgram), the separate plugin is ignored.
- **Async functions only.** `@llm.register_function()` requires async functions; sync functions raise `ValueError`.
- **Event handlers are fire-and-forget.** Don't rely on handlers completing before the next line of agent code. Use `agent.simple_response(..., interrupt=True)` for synchronous control.
- **Agent requires at least one audio path.** In non-realtime mode, provide STT, TTS, turn detection, or video processors; video-only agents without LLM are allowed only with processors.
- **API keys in `.env`.** Vision Agents auto-loads from `.env` for all plugins. Missing keys cause silent failures at runtime.
- **Session limits in production.** Set `max_concurrent_sessions`, `max_sessions_per_call`, and `agent_idle_timeout` to prevent resource exhaustion.
- **Interrupt parameter behavior.** `interrupt=True` preempts in-flight responses; `interrupt=False` queues after current output. Use `interrupt=True` for urgent messages.
- **Video override path.** Set `agent.set_video_track_override_path()` before calling `join()`, not after.

## Verification Checklist

Before submitting agent code:

- [ ] Agent created with `async def create_agent()` returning an `Agent` instance
- [ ] `join_call()` defined and calls `agent.join(call)` as context manager
- [ ] `.env` file populated with all required API keys (STREAM_API_KEY, GOOGLE_API_KEY, etc.)
- [ ] `instructions` parameter set with clear system prompt
- [ ] Realtime mode: only `llm=provider.Realtime()`, no separate STT/TTS
- [ ] Custom pipeline: `llm`, `stt`, `tts` all provided
- [ ] Function calls: all registered functions are async
- [ ] Event handlers: all handlers are async functions
- [ ] Deployment: `Dockerfile` present and builds without errors
- [ ] HTTP server: tested with `uv run agent.py serve` and endpoints respond
- [ ] Tests: pytest configured with `asyncio_mode = auto` in `pytest.ini`
- [ ] Metrics: OpenTelemetry exporter configured if monitoring required
- [ ] Session limits: `max_concurrent_sessions`, `max_session_duration_seconds` set for production
- [ ] Error handling: subscribe to component error events (STTErrorEvent, LLMErrorEvent, etc.)

## Resources

**Comprehensive navigation:** https://visionagents.ai/llms.txt

**Critical documentation:**
1. [Quickstart](https://visionagents.ai/introduction/quickstart) — Build your first agent in 5 minutes
2. [Voice Agents](https://visionagents.ai/introduction/voice-agents) — Realtime vs custom pipeline, function calling, phone integration
3. [Deploying Overview](https://visionagents.ai/guides/deploying-overview) — Path from local dev to Kubernetes
4. [Agent Class Reference](https://visionagents.ai/core/agent-core) — Full API, lifecycle, event system
5. [HTTP Server](https://visionagents.ai/guides/http-server) — Session management, scaling, authentication
6. [Integrations](https://visionagents.ai/integrations/introduction-to-integrations) — 35+ providers, installation, swapping
7. [Testing](https://visionagents.ai/guides/testing) — TestSession, mocking, LLMJudge
8. [Event System](https://visionagents.ai/guides/event-system) — Subscribing, patterns, error handling

---

> For additional documentation and navigation, see: https://visionagents.ai/llms.txt