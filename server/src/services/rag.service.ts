import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { z } from "zod";

// --- __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MongoDB Native Client ---
let mongoClient: MongoClient | null = null;

const getMongoClient = async (): Promise<MongoClient> => {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGODB_URI || "");
    await mongoClient.connect();
    console.log(" Connected to MongoDB for knowledge base");
  }
  return mongoClient;
};

// --- Google Embeddings ---
const getEmbeddings = () => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set in .env!");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-embedding-001",
  });
};

// --- Vector Store ---
const getVectorStore = async () => {
  const client = await getMongoClient();
  const collection = client.db("edureach_db").collection("knowledge_docs");
  return new MongoDBAtlasVectorSearch(getEmbeddings(), {
    collection: collection as any,
    indexName: "edureach_vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });
};

// --- Initialize Knowledge Base (runs once at startup) ---
export const initializeKnowledgeBase = async (): Promise<void> => {
  const client = await getMongoClient();
  const collection = client.db("edureach_db").collection("knowledge_docs");

  const docWithEmbedding = await collection.findOne({
    embedding: { $exists: true, $not: { $size: 0 } },
  });

  if (docWithEmbedding) {
    const count = await collection.countDocuments();
    console.log(` Knowledge base already indexed with ${count} chunks`);
    return;
  }

  console.log(" Indexing knowledge base...");

  const knowledgeBasePath = path.join(
    __dirname,
    "../../knowledge-base/edureach-knowledge.txt"
  );

  const text = await fs.readFile(knowledgeBasePath, "utf-8");
  const docs = [{ pageContent: text, metadata: { source: knowledgeBasePath } }];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitDocuments(docs);
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(chunks);

  console.log(` Stored ${chunks.length} chunks in knowledge base`);
};

// --- Retrieve Tool ---
const createRetrieveTool = (vectorStore: MongoDBAtlasVectorSearch) => {
  return tool(
    async ({ query }: { query: string }) => {
      const retrievedDocs = await vectorStore.similaritySearch(query, 3);
      return retrievedDocs
        .map(
          (doc) =>
            `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
        )
        .join("\n\n");
    },
    {
      name: "retrieve",
      description:
        "Search the EduReach college knowledge base to answer questions about courses, fees, admissions, placements, facilities, faculty, scholarships, and contact information.",
      schema: z.object({
        query: z.string().describe("The search query to find relevant information"),
      }),
    }
  );
};

// --- Get RAG Response (called on every chat message) ---
export const getRAGResponse = async (question: string): Promise<string> => {
  try {
    const vectorStore = await getVectorStore();
    const retrieve = createRetrieveTool(vectorStore);

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      temperature: 0.7,
    });

    const agent = createReactAgent({
      llm: model,
      tools: [retrieve],
    });

    const result = await agent.invoke({
      messages: [
        {
          role: "system",
          content: `You are Ava, a helpful AI counselor for EduReach College. 
You help students with questions about courses, fees, admissions, placements, scholarships, campus facilities, and college life.
Always search the knowledge base before answering.
Be friendly, accurate, and concise.
If you cannot find the answer in the knowledge base, say so honestly.`,
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    const lastMessage = result.messages.at(-1);
    if (!lastMessage) throw new Error("No response from agent");
    const content = lastMessage.content;
    return typeof content === "string"
      ? content
      : JSON.stringify(content);

  } catch (error) {
    console.error("RAG error:", error);
    throw new Error("Failed to get AI response");
  }
};