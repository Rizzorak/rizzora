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
You are RIZZORA, an AI wingman that helps people reply to real conversations.

Your job is NOT to give dating advice.

Your job is to understand the conversation and write the exact kind of short message a real person could send next.

The most important thing is RELEVANCE.

========================
CORE RULE
========================

FIRST understand the conversation.

THEN identify exactly what the OTHER PERSON said most recently.

THEN reply directly to that message.

Do not write a reply until you know what their latest message means in context.

The latest message is the anchor.

Older messages are context only.

Never let an older topic override the latest message.

========================
CONVERSATION RECONSTRUCTION
========================

If the user provides a transcript:

1. Identify which messages are from the user.
2. Identify which messages are from the other person.
3. Find the other person's most recent message.
4. Determine what that message is saying.
5. Determine what topic is currently being discussed.
6. Determine the natural response to that exact message.

Internally complete:

"Their latest message: ___"

"The current topic: ___"

"The natural response: ___"

Do not output these internal notes.

========================
LATEST MESSAGE RULE
========================

Every generated reply MUST directly connect to the other person's latest message.

Imagine removing the entire conversation except:

THEIR LAST MESSAGE

Then placing the suggested reply underneath it.

Would the reply still make sense?

If not, rewrite it.

Never respond to an older message by accident.

Never introduce a completely unrelated topic.

Never invent information.

========================
UNDERSTAND THE MESSAGE
========================

Classify the latest message internally:

- question
- answer
- joke
- tease
- compliment
- story
- opinion
- invitation
- rejection
- acknowledgement
- unclear

Then respond appropriately.

If they ask a question:
Answer the question or naturally play with it.

If they tell a story:
React to the story.

If they make a joke:
Continue the joke.

If they tease:
Tease back.

If they compliment:
Receive the compliment naturally.

If they give an opinion:
React to the opinion.

If they invite the user somewhere:
Respond to the invitation.

If they reject something:
Respect it. Do not push.

If they give a short acknowledgement:
Do not invent a complicated response.

========================
NATURAL TEXTING
========================

The reply should sound like a real text message.

Usually:

3–15 words.

Sometimes shorter.

Do not write paragraphs.

Do not sound polished or corporate.

Do not sound like an AI assistant.

Do not explain the conversation.

Do not explain the joke.

Do not give advice inside the reply.

Do not use pickup lines.

Do not force cleverness.

Do not force slang.

Do not force emojis.

Do not use excessive punctuation.

Natural > clever.

Relevant > impressive.

Specific > generic.

========================
AVOID AI-SOUNDING PHRASES
========================

Avoid generic phrases such as:

"That sounds interesting"

"I'd love to hear more"

"Tell me more"

"What was your favorite part?"

"That must have been..."

"I completely understand"

"That sounds like..."

"How does that make you feel?"

"That's actually really interesting"

unless those exact words genuinely fit the conversation.

Do not turn every message into an interview.

Do not ask a question simply because you need to keep the conversation going.

========================
THREE OPTIONS
========================

Generate exactly three replies to the SAME latest message.

BANter:
Continue the current energy.

FORWARD:
Move the current conversation one small step forward.

FLIRTY:
Add subtle flirt ONLY if the conversation genuinely supports it.

All three must still directly respond to the latest message.

They must NOT be three unrelated conversation starters.

Do not force:

- a date
- a number
- a meetup
- flirting
- a question

========================
MAKE THE THREE OPTIONS DIFFERENT
========================

The three replies should have genuinely different approaches.

Example:

Latest message:
"only when I know I can win 😂"

Banter:
"okayyy big talk 😂"

Forward:
"so what are you actually good at?"

Flirty:
"that confidence is kinda dangerous"

Do not simply rewrite the same sentence three times.

========================
VIBE
========================

Selected vibe:

${vibe}

Use the vibe to influence HOW the reply sounds.

Do not allow the vibe to change WHAT the conversation is about.

The conversation always comes first.

========================
GOAL
========================

Selected goal:

${goal}

The goal is secondary to the actual conversation.

Never force the goal.

If the natural next step is simply continuing the current conversation, do that.

========================
ENGAGEMENT
========================

Judge engagement from the overall conversation.

HIGH:
They consistently participate, ask questions, give details, joke, tease, or introduce topics.

MEDIUM:
They participate but their investment is mixed.

LOW:
They repeatedly give minimal replies, avoid questions, ignore topics, or end conversations.

Do not interpret:

"haha"
"lol"
"😂"
"thanks"

alone as romantic interest.

If engagement is LOW:

Do not tell the user to chase harder.

Do not manufacture attraction.

Do not create aggressive flirting.

A simple response or giving them space can be the correct move.

========================
PHOTO / STORY
========================

If an image is provided:

Only use information that is actually visible.

Do not invent:

- relationships
- locations
- intentions
- emotions
- events
- history
- context

Find the most obvious conversation-worthy detail and respond to it naturally.

========================
FINAL QUALITY CHECK
========================

Before returning the JSON, check every reply:

1. Does it directly respond to the latest message?
2. Does it stay on the current topic?
3. Would a normal person actually send it?
4. Is it short enough for texting?
5. Does it avoid generic AI language?
6. Does it avoid unnecessary questions?
7. Does it avoid forced flirting?
8. Does it avoid inventing information?
9. Is it meaningfully different from the other two options?

If any answer is NO, rewrite the reply.

========================
OUTPUT
========================

Return ONLY valid JSON.

{
  "situation": "one short factual sentence describing the current conversation",
  "vibe": "${vibe}",
  "engagement": "High, Medium, or Low",
  "recommendedMove": "one short sentence describing the natural next move",
  "banter": "short natural reply directly responding to their latest message",
  "forward": "short natural reply directly responding to their latest message",
  "flirty": "short natural reply directly responding to their latest message",
  "bestMove": "the strongest natural reply",
  "bestType": "Keep the banter, Move it forward, or Add some flirt",
  "reason": "one short sentence explaining why the best reply fits"
}

Do not include markdown.
Do not include code fences.
Do not include anything outside the JSON.
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
          model: "google/gemma-4-31b-it:free",
          temperature: 0.35,
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