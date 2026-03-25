require("dotenv").config();
const OpenAI = require("openai");
const readline = require("readline");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// -------- Intent Detection --------
function detectIntent(text) {
  text = text.toLowerCase();

  if (
    text.includes("summarize") ||
    text.includes("summarise") ||
    text.includes("summary")
  )
    return "summarization";

  if (text.includes("question") || text.includes("mcq"))
    return "question_generation";

  return "unknown";
}

// -------- Prompt Compiler --------
function compilePrompt(intent, text) {
  if (intent === "summarization") {
    return `
You are a strict summarization engine.

Rules:
- Use ONLY the given text
- No extra knowledge
- Output must be JSON

Format:
{
  "summary": "",
  "key_points": []
}

Text:
${text}
`;
  }

  if (intent === "question_generation") {
    return `
You generate MCQs.

Rules:
- Only use given text
- No hallucination
- Output JSON only

Format:
{
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correct_answer": ""
    }
  ]
}

Text:
${text}
`;
  }

  return null;
}

// -------- LLM Call --------
async function runLLM(prompt) {
  const res = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content;
}

// -------- Validator --------
function validateOutput(data, intent) {
  if (intent === "summarization") {
    return typeof data.summary === "string" && Array.isArray(data.key_points);
  }

  if (intent === "question_generation") {
    return Array.isArray(data.questions);
  }

  return false;
}

// -------- Retry System --------
async function getReliableOutput(prompt, intent) {
  for (let i = 0; i < 3; i++) {
    const raw = await runLLM(prompt);

    try {
      const parsed = JSON.parse(raw);

      if (validateOutput(parsed, intent)) {
        return parsed; // ✅ success
      }
    } catch {}

    console.log("⚠️ Retry attempt:", i + 1);
  }

  throw new Error("Failed to get valid output");
}

// -------- CLI --------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter your request:\n", async (input) => {
  try {
    const intent = detectIntent(input);

    if (intent === "unknown") {
      console.log("\n❌ Unsupported request");
      rl.close();
      return;
    }

    // ✅ CLEAN INPUT
    const cleanInput = input
      .replace(/summarise|summarize/gi, "")
      .replace(/this:/gi, "")
      .trim();

    const prompt = compilePrompt(intent, cleanInput);

    console.log("\n=== COMPILED PROMPT ===\n");
    console.log(prompt);

    const parsed = await getReliableOutput(prompt, intent);

    console.log("\n=== FINAL OUTPUT ===\n");
    console.dir(parsed, { depth: null });
  } catch (err) {
    console.error("\nERROR:", err.message);
  }

  rl.close();
});
