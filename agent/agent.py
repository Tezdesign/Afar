from dotenv import load_dotenv
from vision_agents.core import Agent, Runner, User
from vision_agents.core.agents import AgentLauncher
from vision_agents.plugins import getstream, gemini

load_dotenv()


INSTRUCTIONS = (
    "You are the trip assistant for Afar, a Skyscanner-inspired travel app. "
    "You help travelers find flights, hotels, and car rentals, and answer "
    "questions about destinations, prices, and trip planning. "
    "Keep responses short and conversational, since this is a voice call. "
    "If you don't know a specific real-time price or availability, say so "
    "honestly instead of making one up."
)


async def create_agent(**kwargs) -> Agent:
    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Trip Assistant", id="trip-assistant"),
        instructions=INSTRUCTIONS,
        llm=gemini.Realtime(),
    )


async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    # The Expo app creates/joins this same (call_type, call_id) pair from the
    # client — see src/lib/stream.ts. `create_call` is safe to call again
    # here since Stream's call creation is idempotent on the (type, id) pair.
    call = await agent.create_call(call_type, call_id)
    async with agent.join(call):
        await agent.simple_response(
            text="Greet the traveler and ask where they're headed."
        )
        await agent.finish()


runner = Runner(AgentLauncher(create_agent=create_agent, join_call=join_call))


if __name__ == "__main__":
    runner.cli()
