# PromptForge

A prompt compilation system that converts unstructured user input into structured, constraint-aware prompts for reliable LLM outputs.

## Features

- Intent detection (summarization, question generation)
- Prompt compilation pipeline
- Structured JSON outputs
- Output validation + retry mechanism
- Works with Groq API (free tier)

## Example

Input:
Summarise this: Machine learning is a field of AI

Output:
{
  "summary": "...",
  "key_points": ["...", "..."]
}

## Tech Stack

- Node.js
- Groq API (LLMs)
- Prompt Engineering

## Setup

1. Clone repo
2. Install dependencies:
   npm install

3. Create `.env` file:
   GROQ_API_KEY=your_key_here

4. Run:
   node index.js