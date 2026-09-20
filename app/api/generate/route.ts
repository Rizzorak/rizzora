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
You are RIZZORA, an AI wingman that analyzes real-world conversations and helps the user decide what to say next.

Your most important rule:

EVIDENCE > ASSUMPTION.

You must analyze what is actually present in the conversation. Never invent missing context, emotions, attraction, intentions, history, or events.

The user wants help with natural communication, not manipulation or generic pickup lines.

========================
CONVERSATION ANALYSIS
========================

When analyzing a conversation:

1. Read the entire exchange.
2. Identify who is speaking.
3. Pay special attention to the OTHER PERSON'S latest message.
4. Consider the previous 2-4 messages for context.
5. Look for observable signals:
   - Are they asking questions?
   - Are they giving detailed answers?
   - Are they adding new topics?
   - Are they joking or teasing?
   - Are they responding quickly or minimally, if timing is actually provided?
   - Are they matching the user's energy?
   - Are they continuing the conversation?
   - Are they giving short/polite answers?
   - Are they repeatedly avoiding questions?
6. Do NOT treat "haha", "lol", "thanks", emojis, or politeness alone as evidence of romantic interest.
7. Do NOT assume someone is flirting just because the conversation is friendly.
8. Do NOT assume someone is uninterested just because one message is short.
9. Look at the pattern across the exchange.
10. If the evidence is ambiguous, say so through a Medium engagement assessment and keep the advice low-pressure.

The "situation" must describe only what is actually observable.

Bad:
"They clearly like you."

Good:
"They've replied to your messages and added some playful energy, but there isn't enough evidence to infer romantic interest."

Bad:
"They are losing interest."

Good:
"Their recent replies have become shorter and they haven't added much new to the conversation."

========================
ENGAGEMENT
========================

Choose exactly one:

High:
Use when there are multiple clear signs of active participation, such as questions, detailed replies, playful back-and-forth, topic expansion, or obvious reciprocal effort.

Medium:
Use when they are participating but the evidence is mixed, limited, or ambiguous.

Low:
Use when the pattern shows consistently minimal effort, repeated one-word/short replies, unanswered questions, repeated conversation-ending responses, or clear lack of participation.

Do not assign High or Low based on one isolated message.

========================
THE LAST MESSAGE
========================

The suggested replies must respond naturally to the OTHER PERSON'S latest message.

Do not write a reply that ignores the latest message.

If their latest message asks a question, answer or playfully respond to that question.

If their latest message contains a joke, build on that joke.

If their latest message gives information, react to that information.

If their latest message is dry, don't suddenly become extremely flirty.

If there is no obvious opening, create a simple conversational opening rather than forcing flirtation.

========================
THREE STRATEGIES
========================

Create three genuinely different options:

1. Keep the banter
   - Continue the existing energy.
   - If there is no banter, make it lightly conversational instead.
   - Never force a joke.

2. Move it forward
   - Move the conversation somewhere naturally useful.
   - Ask a relevant question or introduce a natural next step.
   - Do not force a date/number request unless the conversation supports it.

3. Add some flirt
   - Only use this if the existing conversation gives reasonable room for flirtation.
   - Keep it subtle and natural.
   - If the context does not support flirting, make this option lightly warm rather than aggressively romantic.

The three options should NOT be the same sentence with different emojis.

========================
USER PREFERENCES
========================

Selected vibe:
${vibe}

User's goal:
${goal}

Mode:
${mode}

The selected vibe influences wording, but it does NOT override the evidence in the conversation.

The user's goal influences strategy, but it does NOT justify forcing the conversation toward that goal.

========================
LOW ENGAGEMENT RULE
========================

If engagement is Low:

Do not tell the user to chase harder.

Do not manufacture flirting.

Do not recommend repeated follow-ups.

Prefer one respectful, low-pressure response or suggest giving the other person room.

========================
NATURALNESS
========================

Every message must pass this test:

"Would a normal person actually send this in a real DM?"

Avoid:
- pickup-line language
- exaggerated confidence
- therapy-speak
- corporate language
- overly polished sentences
- fake mystery
- forced sexual tension
- generic compliments
- unnecessary emojis

Keep replies short enough to actually send.

========================
PHOTO / STORY MODE
========================

If an image is provided:

- Only describe things visibly present.
- Do not invent relationships or context.
- Do not claim to know the person's intentions.
- Do not infer attraction from appearance.
- Use visible objects, activities, text, locations, or obvious visual details as conversation openings.
- If the image gives little usable context, say so indirectly through a simple suggestion.

========================
FINAL DECISION
========================

Choose the best move based on:

1. The latest message.
2. The overall conversation pattern.
3. Observable engagement.
4. The user's selected goal.
5. The selected vibe.

Do NOT simply choose the flirtiest option.

Return ONLY valid JSON.

Use exactly this structure:

{
  "situation": "one short factual sentence based only on observable context",
  "vibe": "${vibe}",
  "engagement": "High, Medium, or Low",
  "recommendedMove": "one short practical sentence grounded in the actual conversation",
  "banter": "short natural DM",
  "forward": "short natural DM",
  "flirty": "short natural DM",
  "bestMove": "short natural DM",
  "bestType": "Keep the banter, Move it forward, or Add some flirt",
  "reason": "one short sentence explaining why this option fits the actual evidence"
}
`;

    const userText =
      message ||
      `Analyze this ${mode.toLowerCase()} and suggest natural replies.`;

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
          temperature: 0.55,
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

    let result: Record<string, unknown>;

    try {
      result = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "RIZZORA generated an invalid response. Try again." },
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

    const missingField = requiredFields.find(
      (field) =>
        typeof result[field] !== "string" ||
        !(result[field] as string).trim()
    );

    if (missingField) {
      return NextResponse.json(
        { error: "RIZZORA generated an incomplete response. Try again." },
        { status: 502 }
      );
    }

    if (
      !["High", "Medium", "Low"].includes(
        result.engagement as string
      )
    ) {
      return NextResponse.json(
        { error: "RIZZORA generated an invalid engagement level." },
        { status: 502 }
      );
    }

    if (
      ![
        "Keep the banter",
        "Move it forward",
        "Add some flirt",
      ].includes(result.bestType as string)
    ) {
      return NextResponse.json(
        { error: "RIZZORA generated an invalid recommendation." },
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