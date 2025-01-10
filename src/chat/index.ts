import { Character } from "@elizaos/core";
import readline from "readline";

interface ChatMessage {
  text: string;
}

interface ChatResponse {
  messages: ChatMessage[];
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function handleUserInput(input: string, agentId: string): Promise<void> {
  if (input.toLowerCase() === "exit") {
    console.log("Exiting chat...");
    rl.close();
    process.exit(0);
  }

  try {
    const response = await fetch(`http://localhost:3000/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: input,
        agentId,
      }),
    });

    const data = (await response.json()) as ChatResponse;
    data.messages.forEach((message) => console.log(`${"Agent"}: ${message.text}`));
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

export function startChat(characters: Character[]): () => void {
  return () => {
    console.log("Starting chat...");
    console.log("Type 'exit' to quit");

    rl.on("line", async (input) => {
      if (characters.length === 1 && characters[0].id) {
        await handleUserInput(input, characters[0].id);
      } else if (characters.length === 1) {
        console.error("Character ID is missing");
      } else {
        console.log("Multiple characters not supported yet");
      }
    });
  };
}
