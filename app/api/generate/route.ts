import { NextResponse } from "next/server";

type RequestBody = {
  message?: string;
  vibe?: string;
  goal?: string;
  mode?: string;
  image?: string | null;
};

type GeneratedResult = {
  situation: string;
  vibe: string;
  engagement: "Low" | "Medium" | "High";
  recommendedMove: string;
  banter: string;
  forward: string;
  flirty: string;
  bestMove: "Keep the banter" | "Move it forward" | "Add some flirt";
  bestType: "banter" | "forward" | "flirty";
  reason: string;
};

const SYSTEM_PROMPT = `
You are RIZZORA, an AI wingman that helps people write natural text messages.

Your job is NOT to generate generic pickup lines.

Your job is to understand the conversation and write three realistic replies to the OTHER PERSON'S LATEST MESSAGE.

CORE RULES:

1. CONTEXT FIRST
Read the entire conversation before answering.

2. IDENTIFY THE LATEST MESSAGE
Determine exactly what the other person most recently said.
All three suggested replies MUST directly respond to that latest message.

3. NO TOPIC JUMPS
Do not suddenly introduce a random topic.
Do not ask an unrelated question.
Do not ignore what the other person just said.

4. SOUND LIKE A REAL PERSON
Replies should feel like something a normal person would actually text.
Avoid:
- corporate language
- therapist language
- motivational language
- overly polished sentences
- long explanations
- generic AI phrases
- pickup-line clichés
- excessive emojis

Most replies should be 3–15 words.

5. MATCH THEIR ENERGY
If they are playful, be playful.
If they are dry, don't become overly enthusiastic.
If they are flirty, you can flirt back.
If they seem uninterested, do not encourage aggressive chasing.

6. THREE DIFFERENT OPTIONS
Create:
- banter: keeps the same conversation playful
- forward: naturally moves the conversation forward
- flirty: adds romantic tension only when the conversation supports it

All three must still respond to the latest message.

7. FLIRT MUST BE EARNED
Do not force flirting into a conversation that has no romantic energy.

8. BEST MOVE
Choose the option that makes the most sense based on the actual conversation.

9. IMAGE / STORY MODE
If an image is provided, only use information visibly available in the image.
Do not invent details.

10. VIBE AND GOAL
Respect the selected vibe and goal, but never let them override the actual conversation context.

11. NATURAL TEXTING
Lowercase is fine.
Fragments are fine.
A little imperfection is fine.
Do not make every response grammatically perfect.

12. NO META COMMENTARY
Do not mention that you are an AI.
Do not explain your internal reasoning.
Do not say "here are some options".

Return ONLY valid JSON matching this exact structure:

{
  "situation": "short description of what is happening",
  "vibe": "short description of the current conversational vibe",
  "engagement": "Low",
  "recommendedMove": "short recommended action",
  "banter": "short natural reply",
  "forward": "short natural reply",
  "flirty": "short natural reply",
  "bestMove": "Keep the banter",
  "bestType": "banter",
  "reason": "short explanation"
}

Allowed engagement values:
Low
Medium
High

Allowed bestMove values:
Keep the banter
Move it forward
Add some flirt

Allowed bestType values:
banter
forward
flirty

Before returning the JSON, silently check:

- Does every reply directly respond to the latest message?
- Would a real person actually text this?
- Are the replies short?
- Is anything random or out of topic?
- Is the flirting appropriate?
- Does the bestMove actually match the conversation?
`;

function cleanJson(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function validateResult(value: unknown): value is GeneratedResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;

  const requiredStrings = [
    "situation",
    "vibe",
    "recommendedMove",
    "banter",
    "forward",
    "flirty",
    "reason",
  ];

  for (const key of requiredStrings) {
    if (typeof result[key] !== "string") {
      return false;
    }
  }

  if (
    result.engagement !== "Low" &&
    result.engagement !== "Medium" &&
    result.engagement !== "High"
  ) {
    return false;
  }

  if (
    result.bestMove !== "Keep the banter" &&
    result.bestMove !== "Move it forward" &&
    result.bestMove !== "Add some flirt"
  ) {
    return false;
  }

  if (
    result.bestType !== "banter" &&
    result.bestType !== "forward" &&
    result.bestType !== "flirty"
  ) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const message = body.message?.trim() ?? "";
    const vibe = body.vibe?.trim() || "Confident";
    const goal = body.goal?.trim() || "Keep conversation going";
    const mode = body.mode?.trim() || "Conversation";
    const image = body.image ?? null;

    if (!message && !image) {
      return NextResponse.json(
        {
          error: "Please provide a conversation or image.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENROUTER_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const userContent: Array<
      | {
          type: "text";
          text: string;
        }
      | {
          type: "image_url";
          image_url: {
            url: string;
          };
        }
    > = [];

    userContent.push({
      type: "text",
      text: `
MODE: ${mode}

VIBE: ${vibe}

GOAL: ${goal}

CONVERSATION / USER INPUT:
${message || "(No text provided. Analyze the image.)"}

Analyze the context carefully and return the required JSON.
      `.trim(),
    });

    if (image) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: image,
        },
      });
    }

    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://rizzora-chi.vercel.app",
          "X-Title": "RIZZORA",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          temperature: 0.35,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
      }
    );

    const rawResponse = await openRouterResponse.text();

    if (!openRouterResponse.ok) {
      let details = rawResponse;

      try {
        const parsed = JSON.parse(rawResponse);
        details = JSON.stringify(parsed);
      } catch {
        // Keep raw response.
      }

      console.error("OpenRouter error:", {
        status: openRouterResponse.status,
        details,
      });

      return NextResponse.json(
        {
          error: "RIZZORA couldn't generate a reply right now.",
          details,
        },
        { status: 502 }
      );
    }

    let openRouterData: {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    try {
      openRouterData = JSON.parse(rawResponse);
    } catch {
      return NextResponse.json(
        {
          error: "OpenRouter returned invalid JSON.",
          details: rawResponse,
        },
        { status: 502 }
      );
    }

    const content = openRouterData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "OpenRouter returned no AI response.",
          details: rawResponse,
        },
        { status: 502 }
      );
    }

    const cleaned = cleanJson(content);

    let generated: unknown;

    try {
      generated = JSON.parse(cleaned);
    } catch {
      console.error("Invalid model JSON:", cleaned);

      return NextResponse.json(
        {
          error: "RIZZORA received an invalid AI response.",
          details: cleaned,
        },
        { status: 502 }
      );
    }

    if (!validateResult(generated)) {
      console.error("Invalid generated result:", generated);

      return NextResponse.json(
        {
          error: "RIZZORA received an incomplete AI response.",
          details: generated,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(generated);
  } catch (error) {
    console.error("RIZZORA API error:", error);

    return NextResponse.json(
      {
        error: "RIZZORA couldn't generate a reply right now.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}