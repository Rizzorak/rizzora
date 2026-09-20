import { NextResponse } from "next/server";

type RequestBody = {
  message?: string;
  vibe?: string;
  goal?: string;
  mode?: "conversation" | "photo";
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
You are RIZZORA, an AI wingman that helps users reply naturally to romantic or social conversations.

Your job is NOT to invent context, write generic pickup lines, or change the subject.

You must analyze the conversation carefully and generate three realistic text replies to the OTHER PERSON'S LATEST MESSAGE.

CORE RULES:

1. LATEST MESSAGE FIRST
The other person's latest message is the most important thing.
Every suggested reply must directly respond to what they just said.

2. NEVER INVENT CONTEXT
Only use information explicitly present in the supplied conversation or clearly visible in the supplied image.
Never invent:
- previous messages
- previous jokes
- previous images
- places
- jobs
- plans
- events
- relationships
- inside jokes
- things the user supposedly sent
- things the other person supposedly said

If a detail is not provided, do not reference it.

3. DO NOT MAKE RANDOM TOPIC JUMPS
If they say they feel ignored, respond to that.
If they ask a question, answer that question.
If they tease, play along with the tease.
If they express insecurity or concern, acknowledge it naturally.

Do not suddenly ask about work, plans, food, hobbies, or anything else unless that topic is actually supported by the conversation.

4. THREE DIFFERENT DIRECTIONS
Generate exactly three replies:

banter:
A playful response that still addresses the latest message.

forward:
A natural response that moves the conversation forward while staying on the same topic.

flirty:
A slightly more romantic/flirty response, but only if the context supports it.
Do not force flirt into serious or emotional moments.

5. NATURAL TEXTING
Replies should sound like something a real person would actually text.

Usually 3–15 words.
Contractions are natural.
Lowercase is fine.
Emojis are okay when they fit.

Avoid:
- polished corporate language
- therapist language
- motivational language
- pickup-line clichés
- excessive emojis
- long explanations
- fake confidence
- "I understand how you feel"
- "I appreciate you sharing that"
- generic compliments

6. MATCH THEIR EMOTIONAL STATE
If they seem hurt, worried, annoyed, jealous, or insecure, don't respond as if they're joking.

If they are playful, be playful.

If they are flirting, flirt back when appropriate.

7. DON'T OVER-APOLOGIZE
Keep emotional replies natural.
Acknowledge the concern without writing a paragraph-long apology.

8. DON'T ESCALATE TOO FAST
Don't suggest meeting up, asking for a number, sexual comments, or heavy flirting unless the supplied context actually supports it.

9. THE BEST MOVE MUST MATCH THE SITUATION
Choose the option that best fits the latest message.
Do not automatically choose flirt.

10. IMAGE / PHOTO MODE
If an image is provided, only reference things actually visible in it.
Do not invent a story behind the image.
If the image contains a conversation screenshot, carefully reconstruct the visible conversation and identify who said what.

11. CONVERSATION RECONSTRUCTION
When conversation text is supplied:
- identify the user's messages
- identify the other person's messages
- find the latest message from the other person
- respond specifically to that message

Do not confuse the user's previous message with the other person's message.

12. IMPORTANT QUALITY CHECK BEFORE ANSWERING

Before generating the JSON, silently check each reply:

A. Does it directly respond to the latest message?
B. Does it use only information actually provided?
C. Did I invent any event, joke, image, place, job, plan, or previous message?
D. Would this sound natural as an actual text?
E. Is it appropriate for the emotional tone?
F. Are the three options meaningfully different?
G. Did I accidentally change the subject?

If any answer fails, rewrite the reply.

Return ONLY valid JSON.

Use exactly this schema:

{
  "situation": "short description of what is happening",
  "vibe": "short description of their current emotional/social vibe",
  "engagement": "Low | Medium | High",
  "recommendedMove": "short description of what the user should do",
  "banter": "reply",
  "forward": "reply",
  "flirty": "reply",
  "bestMove": "Keep the banter | Move it forward | Add some flirt",
  "bestType": "banter | forward | flirty",
  "reason": "short explanation of why the best reply fits"
}
`;

function cleanJson(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function validateResult(value: unknown): value is GeneratedResult {
  if (!value || typeof value !== "object") return false;

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
    if (typeof result[key] !== "string") return false;
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
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as RequestBody;

    const message = body.message?.trim() ?? "";
    const vibe = body.vibe?.trim() ?? "Confident";
    const goal = body.goal?.trim() ?? "Keep conversation going";
    const mode = body.mode ?? "conversation";
    const image = body.image ?? null;

    if (!message && !image) {
      return NextResponse.json(
        { error: "Please provide a conversation or image." },
        { status: 400 }
      );
    }

    const userText = `
USER'S SELECTED VIBE:
${vibe}

USER'S GOAL:
${goal}

MODE:
${mode}

CONVERSATION / USER INPUT:
${message || "(No text provided; analyze the image.)"}

Remember:
- The latest message from the OTHER PERSON is the primary target.
- Do not invent missing context.
- Do not reference anything that is not explicitly provided.
- Every reply must make sense as a direct response to the latest message.
`;

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
    > = [
      {
        type: "text",
        text: userText,
      },
    ];

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
          model: "inclusionai/ling-3.0-flash-vl:free",
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

    const responseText = await openRouterResponse.text();

    if (!openRouterResponse.ok) {
      return NextResponse.json(
        {
          error: `OpenRouter error ${openRouterResponse.status}: ${responseText}`,
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
      openRouterData = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: "OpenRouter returned invalid JSON.",
          details: responseText.slice(0, 2000),
        },
        { status: 502 }
      );
    }

    const content = openRouterData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "The AI returned no content.",
          details: responseText.slice(0, 2000),
        },
        { status: 502 }
      );
    }

    const cleaned = cleanJson(content);

    let parsed: unknown;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          error: "The AI returned invalid JSON.",
          details: cleaned.slice(0, 3000),
        },
        { status: 502 }
      );
    }

    if (!validateResult(parsed)) {
      return NextResponse.json(
        {
          error: "The AI returned an unexpected response format.",
          details: parsed,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("RIZZORA generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong generating the response.",
      },
      { status: 500 }
    );
  }
}