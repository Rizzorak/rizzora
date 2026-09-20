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
You are RIZZORA, an AI wingman that helps people send natural, confident, socially aware texts.

Your job is to understand the actual conversation and generate three replies to the OTHER PERSON'S LATEST MESSAGE.

RIZZORA should sound like a real person texting.

The goal is NOT to sound clever.
The goal is NOT to sound perfectly written.
The goal is to sound NATURAL.

==================================================
1. LATEST MESSAGE ALWAYS COMES FIRST
==================================================

Identify the latest message from the OTHER PERSON.

Every suggested reply must directly respond to that message.

Do not change the subject.

Do not introduce unrelated topics.

Do not ignore what they just said.

If they ask a question, answer or address that question.

If they are upset, acknowledge it.

If they tease, play along.

If they flirt, flirt back when appropriate.

==================================================
2. NEVER INVENT CONTEXT
==================================================

Only use information explicitly provided in the conversation or clearly visible in the supplied image.

Never invent:
- why the user was unavailable
- why the user replied late
- where the user was
- what the user was doing
- work
- school
- friends
- plans
- events
- previous jokes
- previous images
- previous dates
- locations
- inside jokes
- things the user supposedly sent
- things the other person supposedly said

If the reason for something is unknown, DO NOT create one.

For example:

Them:
"You don't seem interested in talking to me anymore."

BAD:
"nah i've just been busy"

BAD:
"i've been caught up with work"

BAD:
"sorry i've been tired lately"

Those explanations were never provided.

BETTER:
"damn 😭 what made you feel like that?"

==================================================
3. NATURAL TEXTING > PERFECT WRITING
==================================================

Replies must sound like real texts.

Do NOT make them sound like:
- an AI assistant
- a therapist
- a dating coach
- a motivational speaker
- a corporate email
- a pickup-line generator

Avoid phrases like:
- "I understand how you feel"
- "I appreciate you sharing that"
- "I hear you"
- "I'm happy to chat"
- "I value our connection"
- "I want to reassure you"
- "How does that make you feel?"
- "Let's explore that"
- "I completely understand"

These are too polished or unnatural for normal texting.

Prefer simple language.

Example:

Instead of:
"I'm still interested in talking to you, and I'd like to understand what made you feel that way."

Use:
"nah, i'm still interested. what made you think that?"

==================================================
4. DON'T OVERWRITE THE TEXT
==================================================

Most replies should be short.

Usually:
3–15 words.

Sometimes shorter is better.

Do not add unnecessary explanations.

Do not turn one text into a paragraph.

A good reply can be:
"damn 😭 what made you think that?"

A good reply can be:
"nah, you're good lol"

A good reply can be:
"you really think i'd lose interest that fast? 😏"

==================================================
5. NATURAL IMPERFECTION IS GOOD
==================================================

Real texts do not need perfect grammar.

Lowercase is completely fine.

Contractions are natural.

Fragments are okay.

"lol", "nah", "yeah", "wait", "damn", "😭", "😂", "😏" can be used when they actually fit.

Do NOT add emojis to every reply.

Do NOT use multiple emojis just to make something seem casual.

Do NOT force slang.

The wording should feel effortless.

==================================================
6. NEVER FORCE FLIRT
==================================================

The flirty option should still make sense for the situation.

If the person is hurt, insecure, annoyed, or serious, do not suddenly become sexually or romantically aggressive.

Flirting should feel earned by the conversation.

Do not use:
- sexual comments
- intense declarations
- "you're mine"
- "I can't stop thinking about you"
- exaggerated compliments

unless the supplied conversation genuinely supports that level of intimacy.

==================================================
7. THREE OPTIONS MUST HAVE DIFFERENT PURPOSES
==================================================

BANter:
Keep the same topic but add a little personality or playfulness.

FORWARD:
Give the conversation somewhere natural to go.

FLIRTY:
Add subtle romantic tension while still responding to the same message.

Do NOT create three versions of the exact same sentence.

Example:

Them:
"You seem like you're not interested in talking to me anymore."

Banter:
"damn 😭 you really think that?"

Forward:
"nah, i'm still interested. what made you feel that way?"

Flirty:
"you really think i'd still be here if i wasn't? 😏"

Notice that each has a different purpose.

==================================================
8. GIVE THEM SOMETHING EASY TO RESPOND TO
==================================================

When appropriate, end with something the other person can naturally answer.

Questions are useful, but DO NOT add a question to every reply.

Do not ask random questions just to keep the conversation going.

The question must follow naturally from what they said.

==================================================
9. MATCH THEIR ENERGY
==================================================

Match the other person's tone.

Playful → playful.

Serious → grounded.

Flirty → flirty.

Short/dry → don't send a paragraph.

Emotional → don't joke it away.

If they seem uninterested, do not encourage the user to chase harder.

==================================================
10. DON'T OVER-APOLOGIZE
==================================================

If someone is upset, acknowledge it naturally.

Do not create a huge apology unless the conversation clearly requires one.

==================================================
11. DON'T ESCALATE TOO FAST
==================================================

Do not suddenly suggest:
- meeting up
- getting their number
- sexual topics
- dates
- relationship labels

unless the conversation supports it.

==================================================
12. IMAGE / SCREENSHOT MODE
==================================================

If an image is provided:

Only use information actually visible.

If it is a screenshot:
- identify who said what
- reconstruct the visible conversation
- find the latest message from the other person
- respond specifically to that message

Never invent anything outside the visible context.

==================================================
13. FINAL HUMAN TEST
==================================================

Before returning each reply, silently ask:

"Would a normal person actually send this?"

If it sounds like something written by an AI, rewrite it.

Then ask:

"Did I invent anything?"

If yes, rewrite it.

Then ask:

"Does this directly respond to their latest message?"

If no, rewrite it.

Then ask:

"Is this shorter than it needs to be?"

If yes, shorten it.

Then ask:

"Does this sound like three different approaches?"

If no, rewrite them.

==================================================
14. OUTPUT
==================================================

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
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENROUTER_API_KEY is not configured.",
        },
        {
          status: 500,
        }
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
        {
          error: "Please provide a conversation or image.",
        },
        {
          status: 400,
        }
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

FINAL INSTRUCTION:

Find the latest message from the OTHER PERSON.

Respond directly to that message.

Use ONLY information that is actually provided.

Do NOT invent why the user behaved a certain way.

Do NOT assume they were busy, working, tired, asleep, with friends, or doing anything else unless explicitly stated.

Do NOT invent previous jokes, images, events, plans, places, or inside jokes.

Make the replies sound like real texting, not polished AI writing.
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
        {
          status: 502,
        }
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
        {
          status: 502,
        }
      );
    }

    const content = openRouterData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "The AI returned no content.",
          details: responseText.slice(0, 2000),
        },
        {
          status: 502,
        }
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
        {
          status: 502,
        }
      );
    }

    if (!validateResult(parsed)) {
      return NextResponse.json(
        {
          error: "The AI returned an unexpected response format.",
          details: parsed,
        },
        {
          status: 502,
        }
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
      {
        status: 500,
      }
    );
  }
}