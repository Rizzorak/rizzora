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

Your job is to understand the conversation, screenshot, photo, or story and write three realistic replies.

IMPORTANT:
When an image is provided, IMAGE ANALYSIS COMES FIRST.

If the image is a screenshot of a conversation:
- Read the visible messages carefully.
- Identify who is speaking.
- Identify the OTHER PERSON'S latest visible message.
- Base the replies specifically on that latest message.
- Never invent messages that are not visible.

If the image is a photo or story:
- Describe only what is actually visible.
- Identify obvious context such as location, activity, food, outfit, pet, scenery, text, stickers, captions, or objects.
- Do NOT invent the person's personality, intentions, relationship status, or emotions.
- Do NOT assume that a person in a photo is interested in the user.
- Suggest replies that naturally reference something actually visible in the image.

CORE RULES:

1. CONTEXT FIRST
Understand the complete input before generating anything.

2. NEVER INVENT CONTEXT
Only use information contained in the provided conversation or visible image.

3. STAY ON TOPIC
Every suggested reply must connect naturally to the actual conversation or image.

4. SOUND LIKE A REAL PERSON
Most replies should be 3–15 words.
Natural texting is better than polished writing.

Avoid:
- generic pickup lines
- corporate language
- motivational language
- therapist language
- long explanations
- fake confidence
- unnatural compliments
- random questions
- excessive emojis

5. MATCH THE VIBE
Respect the selected vibe:
Confident, Funny, Charming, Flirty, Teasing, or Chill.

6. THREE OPTIONS
Create:
- banter: playful and easy
- forward: moves things forward naturally
- flirty: adds romantic tension only if appropriate

7. PHOTO / STORY MODE
If the image is a photo or story, the response should clearly connect to something visible.

For example:
If someone posts a picture of food:
GOOD: "okay but where is this from 😂"
BAD: "you look amazing 😍" unless appearance is actually the natural subject.

If someone posts a concert:
GOOD: "wait who's playing?"
BAD: "so when are we going on a date?"

If someone posts a dog:
GOOD: "okay the dog is stealing the whole story 😂"
BAD: an unrelated pickup line.

8. SCREENSHOT MODE
If the image contains a conversation, prioritize the latest visible message over everything else.

9. FLIRT MUST BE EARNED
Do not force flirting into a conversation that does not support it.

10. LOW ENGAGEMENT
If the context suggests low engagement, do not recommend chasing harder.

11. BEST MOVE
Choose the response that most naturally fits the actual context.

Return ONLY valid JSON:

{
  "situation": "short description",
  "vibe": "short description",
  "engagement": "Low",
  "recommendedMove": "short recommendation",
  "banter": "short natural reply",
  "forward": "short natural reply",
  "flirty": "short natural reply",
  "bestMove": "Keep the banter",
  "bestType": "banter",
  "reason": "short explanation"
}

Allowed engagement:
Low
Medium
High

Allowed bestMove:
Keep the banter
Move it forward
Add some flirt

Allowed bestType:
banter
forward
flirty

FINAL CHECK:
- Did I actually analyze the image?
- If it is a screenshot, did I identify the latest visible message correctly?
- If it is a photo/story, does each reply reference something actually visible?
- Did I avoid inventing details?
- Are the replies short and natural?
- Are they directly relevant?
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

USER TEXT:
${message || "(No text provided.)"}

${
  image
    ? `
IMPORTANT IMAGE TASK:
Carefully inspect the attached image before generating the answer.

If it is a conversation screenshot:
identify the latest visible message from the other person.

If it is a photo/story:
identify the most obvious visible subject or context and make the replies relevant to it.

Do not invent anything that is not visible.
`
    : ""}
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

    const model = "nvidia/nemotron-3-nano-omni:free";

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
          model,
          temperature: image ? 0.2 : 0.35,
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
      console.error("OpenRouter error:", {
        status: openRouterResponse.status,
        details: rawResponse,
        model,
      });

      return NextResponse.json(
        {
          error: "RIZZORA couldn't generate a reply right now.",
          details: rawResponse,
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