import { DirectClient } from "@elizaos/client-direct";
import {
  AgentRuntime,
  elizaLogger,
  settings,
  stringToUuid,
  type Character,
} from "@elizaos/core";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { createNodePlugin } from "@elizaos/plugin-node";
import { solanaPlugin } from "@elizaos/plugin-solana";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDbCache } from "./cache/index.js";
import { character } from "./character.js";
import { startChat } from "./chat/index.js";
import { initializeClients } from "./clients/index.js";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.js";
import { initializeDatabase } from "./database/index.js";
import express, { Request, Response } from "express";
import { preprocessTokenData } from "./data/preprocess.js";
import { trainModel } from "./ml/model.js";
import * as tf from "@tensorflow/tfjs-node";
import { fetchTokenData } from "./data/fetcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

let nodePlugin: any | undefined;

export function createAgent(
  character: Character,
  db: any,
  cache: any,
  token: string
) {
  elizaLogger.success(
    elizaLogger.successesTitle,
    "Creating runtime for character",
    character.name,
  );

  nodePlugin ??= createNodePlugin();

  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    evaluators: [],
    character,
    plugins: [
      bootstrapPlugin,
      nodePlugin,
      character.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
    ].filter(Boolean),
    providers: [],
    actions: [],
    services: [],
    managers: [],
    cacheManager: cache,
  });
}

async function startAgent(character: Character, directClient: DirectClient) {
  try {
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    const token = getTokenForProvider(character.modelProvider, character) || '';
    const dataDir = path.join(__dirname, "../data");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = initializeDatabase(dataDir);

    await db.init();

    const cache = initializeDbCache(character, db);
    const runtime = createAgent(character, db, cache, token);

    await runtime.initialize();

    runtime.clients = await initializeClients(character, runtime);

    directClient.registerAgent(runtime);

    // report to console
    elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);

    return runtime;
  } catch (error) {
    elizaLogger.error(
      `Error starting agent for character ${character.name}:`,
      error,
    );
    console.error(error);
    throw error;
  }
}

const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
};

const startAgents = async () => {
  const directClient = new DirectClient();
  let serverPort = parseInt(settings.SERVER_PORT || "3000");
  const args = parseArguments();

  let charactersArg = args.characters || args.character;
  let characters = [character];

  console.log("charactersArg", charactersArg);
  if (charactersArg) {
    characters = await loadCharacters(charactersArg);
  }
  console.log("characters", characters);
  try {
    for (const character of characters) {
      await startAgent(character, directClient as DirectClient);
    }
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
  }

  while (!(await checkPortAvailable(serverPort))) {
    elizaLogger.warn(`Port ${serverPort} is in use, trying ${serverPort + 1}`);
    serverPort++;
  }

  // upload some agent functionality into directClient
  directClient.startAgent = async (character: Character) => {
    // wrap it so we don't have to inject directClient later
    return startAgent(character, directClient);
  };

  directClient.start(serverPort);

  if (serverPort !== parseInt(settings.SERVER_PORT || "3000")) {
    elizaLogger.log(`Server started on alternate port ${serverPort}`);
  }

  elizaLogger.log("Chat started. Type 'exit' to quit.");
  const chat = startChat(characters);
  chat();
};

startAgents().catch((error) => {
  elizaLogger.error("Unhandled error in startAgents:", error);
  process.exit(1);
});

const app = express();
app.use(express.json());

app.post("/analyze", async (req: Request, res: Response) => {
  const tokenAddress = req.body.tokenAddress;
  const tokenData = await fetchTokenData(tokenAddress);
  const processedData = await preprocessTokenData(tokenData);
  const model = await trainModel([
    { volumeAnomaly: 0.75, holderConcentration: 0.9, liquidityScore: 0.3, isRugPull: true },
    { volumeAnomaly: 0.2, holderConcentration: 0.4, liquidityScore: 0.8, isRugPull: false }
  ]);
  const prediction = await model.predict(tf.tensor2d([Object.values(processedData)], [1, 3]));
  res.json({ riskScore: (prediction as tf.Tensor).dataSync() });
});

app.listen(3000, () => console.log("Server running on port 3000"));
