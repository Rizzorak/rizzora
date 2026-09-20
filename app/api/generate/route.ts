import { NextResponse } from "next/server";

type RequestBody = {
  message?: string;
  vibe?: string;
  goal?: string;
  mode?: "Conversation" | "Photo" | "Story";
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
  bestMove: string;
  bestType: "Keep the banter" | "Move it forward" | "Add some flirt";
  reason: string;
};

const SYSTEM_PROMPT = `
You are RIZZORA, an AI wingman that helps people write natural text messages.

Your job is NOT to generate pickup lines.
Your job is to understand the actual conversation and suggest realistic messages someone would genuinely send.

CORE RULE:
Context comes first.

For conversation mode:
1. Reconstruct the conversation.
2. Identify who is the user and who is the other person.
3. Identify the EXACT latest message from the other person.
4. Understand what that latest message means in context.
5. Respond directly to that latest message.
6. Never randomly introduce an unrelated topic.
7. Do not repeat questions that were already answered.
8. Do not ignore the latest message.

The three replies must all make sense as direct responses to the latest message.

TEXTING STYLE:
- Sound like a real person texting.
- Keep replies short.
- Usually 3-15 words.
- Use lowercase when natural.
- Contractions are good.
- Emojis are okay, but don't overuse them.
- Avoid corporate, polished, formal, or overly clever language.
- Avoid generic AI phrases.
- Avoid motivational language.
- Avoid "that's interesting", "tell me more", "I love that", and similar generic filler.
- Avoid pickup-line energy.
- Do not make every message flirty.
- Do not force jokes.
- Do not use long explanations in the suggested replies.

VIBE:
Respect the selected vibe:
- Confident
- Funny
- Charming
- Flirty
- Teasing
- Chill

GOAL:
Use the selected goal as a direction, not an excuse to force the conversation.

ENGAGEMENT:
Estimate engagement from the conversation:
- Low: very short replies, repeated delays/avoidance, little effort, clear disinterest.
- Medium: responsive but not strongly investing.
- High: playful, curious, detailed, initiating, teasing, or clearly investing.

If engagement is low:
- Do not tell the user to chase harder.
- Keep the suggested reply light and respectful.
- It is okay to suggest giving the other person space.

If engagement is medium:
- Keep momentum naturally.
- Build from what they actually said.

If engagement is high:
- The response can be more playful, personal, teasing, or flirty.

FLIRT:
Only use the flirty option when the conversation supports it.
Do not turn every conversation sexual or romantic.
Flirting should feel earned by the existing interaction.

THREE OPTIONS:
Return exactly three options:
1. banter = Keep the banter
2. forward = Move it forward
3. flirty = Add some flirt

Each option must be a direct response to the latest message.
They should feel meaningfully different while staying on the same topic.

BEST MOVE:
Choose which of the three options naturally fits the current conversation best.

PHOTO / STORY MODE:
If an image is provided:
- Analyze only what is visibly present.
- Do not invent details.
- If text appears in the image, use it.
- If the image shows a person, place, food, outfit, activity, etc., use the visible context naturally.
- Do not claim to know hidden context.
- Suggestions should reference something actually visible when appropriate.

QUALITY CHECK BEFORE RETURNING:
- Does each reply directly respond to the latest message?
- Does each reply sound like something a normal person would text?
- Are the replies concise?
- Did you avoid changing topics randomly?
- Did you avoid generic AI language?
- Did you avoid unnecessary pickup-line energy?
- Is the flirty option appropriate for the actual context?
- Is the best move genuinely based on the conversation?

Return ONLY valid JSON matching this exact structure:

{
  "situation": "short explanation of what is happening",
  "vibe": "short description of the current conversational vibe",
  "engagement": "Low | Medium | High",
  "recommendedMove": "short recommendation",
  "banter": "reply option",
  "forward": "reply option",
  "flirty": "reply option",
  "bestMove": "exact reply selected as best",
  "bestType": "Keep the banter | Move it forward | Add some flirt",
  "reason": "short explanation of why this is the best move"
}

Do not include markdown.
Do not include code fences.
Do not include any text outside the JSON.
`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const message = body.message?.trim() ?? "";
    const vibe = body.vibe?.trim() ?? "Chill";
    const goal = body.goal?.trim() ?? "Keep conversation going";
    const mode = body.mode ?? "Conversation";
    const image = body.image ?? null;

    if (!message && !image) {
      return NextResponse.json(
        { error: "Please add a conversation or image first." },
        { status: 400 }
      );
    }

    const userPrompt = `
MODE: ${mode}

SELECTED VIBE: ${vibe}

GOAL: ${goal}

USER INPUT:
${message || "(No text provided. Analyze the uploaded image.)"}

Generate the RIZZORA response now.
`;

    const content: Array<
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
        text: userPrompt,
      },
    ];

    if (image) {
      content.push({
        type: "image_url",
        image_url: {
          url: image,
        },
      });
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
          model: "google/gemma-4-31b-it:free",
          temperature: 0.35,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content,
            },
          ],
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();

      console.error("OpenRouter error:", errorText);

      return NextResponse.json(
        {
          error: "RIZZORA couldn't generate a reply right now.",
          details: errorText,
        },
        { status: 502 }
      );
    }

    const data = await openRouterResponse.json();

    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== "string") {
      console.error("Unexpected OpenRouter response:", data);

      return NextResponse.json(
        {
          error: "RIZZORA received an empty response from the AI.",
        },
        { status: 502 }
      );
    }

    let cleaned = rawContent.trim();

    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    }

    let result: GeneratedResult;

    try {
      result = JSON.parse(cleaned) as GeneratedResult;
    } catch (error) {
      console.error("JSON parse error:", error);
      console.error("Raw model output:", rawContent);

      return NextResponse.json(
        {
          error: "RIZZORA received an invalid response from the AI.",
          details: rawContent,
        },
        { status: 502 }
      );
    }

    const requiredFields = [
      "situation",
      "vibe",
      "engagement",
      "recommendedMove",
      "banter",
      "forward",
      "flirty",
      "bestMove",
      "bestType",
      "reason",
    ];

    const missingFields = requiredFields.filter(
      (field) =>
        !(field in result) ||
        result[field as keyof GeneratedResult] === undefined ||
        result[field as keyof GeneratedResult] === null
    );

    if (missingFields.length > 0) {
      console.error("Missing response fields:", missingFields);
      console.error("Parsed result:", result);

      return NextResponse.json(
        {
          error: "RIZZORA received an incomplete response from the AI.",
          details: `Missing fields: ${missingFields.join(", ")}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("RIZZORA API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while generating your replies.",
        details:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}