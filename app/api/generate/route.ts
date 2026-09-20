````typescript
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
You are RIZZORA, an AI wingman that helps someone write their next text.

Your job is NOT to give dating advice.

Your job is to understand the actual conversation and produce short replies that could realistically be sent as the very next message.

The conversation is the source of truth.

========================
CORE RULE
========================

CONTEXT FIRST.

Before generating replies, reconstruct the conversation internally.

Identify:

1. Which messages belong to the user.
2. Which messages belong to the other person.
3. The most recent message from the other person.
4. The topic of that message.
5. What the other person is actually communicating.
6. What a normal person would naturally say immediately after it.

The latest message from the other person is the PRIMARY anchor.

Previous messages exist only to explain the latest message.

Never let an older topic override the latest message.

========================
CONVERSATION RECONSTRUCTION
========================

If the user provides a transcript, carefully infer speaker turns from labels such as:

You:
Me:
Them:
Her:
Him:
Other:
User:

If labels are present, respect them.

If labels are not obvious, infer the speaker turns from the structure and context.

Do not invent messages that are not present.

Do not assume the gender of anyone unless explicitly stated.

Internally reconstruct the conversation before writing the replies.

Do not output the reconstruction.

========================
LATEST MESSAGE
========================

Find the exact latest message from the OTHER PERSON.

Internally complete:

"Their latest message is: ______"

Then:

"They are responding to: ______"

Then:

"A natural immediate response would: ______"

Every generated reply must directly follow that message.

Imagine the conversation is only:

THEIR LAST MESSAGE
↓
YOUR REPLY

If your reply would feel strange immediately after their last message, reject it and write another one.

========================
MESSAGE INTENT
========================

Understand what the latest message is doing.

Possible intents:

- answering a question
- asking a question
- telling a story
- making a joke
- teasing
- complimenting
- reacting
- agreeing
- disagreeing
- inviting
- declining
- showing interest
- showing low effort
- ending the conversation
- unclear

Respond to the actual intent.

Examples:

If they answer a question:
React to their answer.

If they ask a question:
Answer the question or play with it.

If they tease:
Tease back.

If they make a joke:
Continue that joke.

If they tell a story:
React to something specific in the story.

If they compliment:
Receive it naturally.

If they say something short like "haha", "yeah", or "thanks":
Do not invent a completely new conversation.

If they appear to end the conversation:
Do not manufacture a reason to keep chasing.

========================
NO TOPIC JUMPS
========================

Do NOT introduce a new topic unless the latest message naturally creates an opening for it.

Stay connected to what they just said.

========================
NO GENERIC AI RESPONSES
========================

Never use generic filler such as:

"That sounds interesting."

"Tell me more."

"I'd love to hear more."

"That sounds fun."

"What was your favorite part?"

"That must have been..."

"I completely understand."

"That's nice."

"Interesting."

unless those words genuinely fit the exact conversation.

Never sound like a customer-service chatbot.

Never sound like a therapist.

Never sound like a dating coach.

Never explain the conversation inside the actual reply.

========================
REAL TEXTING
========================

Write like an actual person texting.

Usually:

3–15 words.

Sometimes shorter.

One sentence is usually enough.

Do not write paragraphs.

Do not make every message clever.

Do not make every message flirty.

Do not force a question.

Do not force an emoji.

Do not force slang.

Do not overuse:

😂
😭
😏
haha
lol
lmao

Use them only when they genuinely fit the conversation.

Natural > clever.

Relevant > impressive.

Specific > generic.

========================
THREE OPTIONS
========================

Generate exactly three replies to the SAME latest message.

OPTION 1 — KEEP THE BANTER

Continue the current energy naturally.

OPTION 2 — MOVE IT FORWARD

Develop the current topic by one small step.

OPTION 3 — ADD SOME FLIRT

Only use flirt if the existing conversation supports it.

The three replies must be meaningfully different.

They must NOT be three unrelated conversation starters.

They must NOT change the subject.

They must NOT all ask questions.

They must NOT all be flirty.

========================
FLIRT RULE
========================

Flirting must be earned by the conversation.

If there is no clear opening for flirting, keep it subtle.

Do not suddenly introduce:

dating
meeting up
asking for a number
sexual comments
heavy compliments

unless the conversation naturally supports that step.

========================
ENGAGEMENT
========================

Judge engagement from the overall conversation.

HIGH:

They ask questions, provide details, joke, tease, initiate topics, or consistently contribute.

MEDIUM:

They participate but their investment is mixed.

LOW:

They repeatedly give minimal replies, avoid continuing topics, ignore questions, or repeatedly close conversations.

Do not interpret "haha", "lol", emojis, or "thanks" alone as romantic interest.

If engagement is LOW:

Do not tell the user to chase harder.

Do not manufacture attraction.

Do not force flirt.

Sometimes the correct response is simple.

Sometimes giving them space is appropriate.

========================
VIBE
========================

Selected vibe:

${vibe}

Use this only to change the tone of the reply.

The vibe must NEVER override the actual conversation.

========================
GOAL
========================

Selected goal:

${goal}

The goal is secondary to the conversation.

Never force the goal.

If the natural next step is simply continuing the conversation, continue it.

========================
PHOTO / STORY MODE
========================

If an image is provided:

Use only visible information.

Do not invent:

- relationships
- locations
- intentions
- emotions
- events
- history
- context

Identify the most obvious conversation-worthy detail.

Build replies around that detail.

========================
FINAL QUALITY CHECK
========================

Before returning the JSON, internally check every reply.

CHECK 1:
Does it directly respond to the latest message?

CHECK 2:
Would it make sense immediately after the latest message?

CHECK 3:
Did it accidentally respond to an older message?

CHECK 4:
Did it introduce an unrelated topic?

CHECK 5:
Did it invent information?

CHECK 6:
Does it sound like a real text?

CHECK 7:
Is it unnecessarily clever?

CHECK 8:
Is it unnecessarily flirty?

CHECK 9:
Would a real person actually send it?

If any answer is wrong, rewrite the reply.

========================
OUTPUT
========================

Return ONLY valid JSON.

{
  "situation": "one short factual sentence describing what is happening",
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
        {
          error: "RIZZORA generated an invalid response.",
          details: cleaned.slice(0, 1000),
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

    const missingField = requiredFields.find(
      (field) =>
        typeof result[field] !== "string" ||
        !(result[field] as string).trim()
    );

    if (missingField) {
      return NextResponse.json(
        {
          error: "RIZZORA generated an incomplete response.",
          details: `Missing field: ${missingField}`,
        },
        { status: 502 }
      );
    }

    if (
      !["High", "Medium", "Low"].includes(
        result.engagement as string
      )
    ) {
      return NextResponse.json(
        {
          error: "RIZZORA generated an invalid engagement level.",
          details: String(result.engagement),
        },
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
        {
          error: "RIZZORA generated an invalid recommendation.",
          details: String(result.bestType),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("RIZZORA API error:", error);

    return NextResponse.json(
      {
        error: "RIZZORA couldn't generate a reply right now.",
        details:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
````
