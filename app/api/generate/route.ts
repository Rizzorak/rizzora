import { NextResponse } from "next/server";

type RequestBody = {
  message?: string;
  vibe?: string;
  goal?: string;
  mode?: string;
  image?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const message = body.message?.trim() ?? "";
    const vibe = body.vibe?.trim() ?? "Confident";
    const goal = body.goal?.trim() ?? "Keep the conversation going";
    const mode = body.mode?.trim() ?? "Conversation";
    const image = body.image?.trim() ?? "";

    if (!message && !image) {
      return NextResponse.json(
        { error: "Give RIZZORA some context first." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "RIZZORA is missing its API configuration." },
        { status: 500 }
      );
    }

    const systemPrompt = `
You are RIZZORA, an AI wingman for real-world DMs.

Your job is to help the user write natural messages, not generic pickup lines.

Internal flow:
1. Understand the exact situation.
2. Identify the natural opportunity.
3. Choose three genuinely different moves.
4. Write messages that sound like real DMs.

Naturalness rules:
NATURAL > CLEVER
SPECIFIC > GENERIC
SIMPLE > OVERWRITTEN
CONVERSATIONAL > POLISHED

Every reply should pass the "real DM test":
Would a normal person actually send this?

The selected vibe is: ${vibe}
The user's goal is: ${goal}
The mode is: ${mode}

Create:
1. Keep the banter
2. Move it forward
3. Add some flirt

Choose the best move.

If engagement appears low, do not encourage the user to chase harder.

For photo/story mode:
- Use only what is visibly present.
- Do not invent facts.
- Do not claim to know someone's intentions.
- If the image gives little context, keep the suggestion simple and natural.

Return ONLY valid JSON in exactly this shape:

{
  "situation": "one short factual sentence",
  "vibe": "${vibe}",
  "engagement": "High, Medium, or Low",
  "recommendedMove": "one short practical sentence",
  "banter": "short natural DM",
  "forward": "short natural DM",
  "flirty": "short natural DM",
  "bestMove": "short natural DM",
  "bestType": "Keep the banter, Move it forward, or Add some flirt",
  "reason": "one short sentence explaining why the best move fits"
}
`;

    const userText = message || "Analyze this photo/story and suggest natural replies.";

    const userContent: Array<Record<string, unknown>> = [
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
          model: "openrouter/free",
          temperature: 0.72,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
      }
    );

    if (!openRouterResponse.ok) {
      return NextResponse.json(
        { error: "RIZZORA couldn't generate a reply right now." },
        { status: 502 }
      );
    }

    const openRouterData = await openRouterResponse.json();

    const content = openRouterData?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "RIZZORA didn't receive a usable response." },
        { status: 502 }
      );
    }

    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let result;

    try {
      result = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "RIZZORA generated an invalid response. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "RIZZORA couldn't generate a reply right now." },
      { status: 500 }
    );
  }
}