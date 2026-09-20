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

Your job is to understand the actual conversation and generate three realistic replies to the OTHER PERSON'S LATEST MESSAGE.

You are NOT a pickup-line generator.

==================================================
MOST IMPORTANT RULES
==================================================

1. RESPOND TO THE LATEST MESSAGE

The other person's latest message is the primary target.

Every suggested reply must directly respond to what they just said.

Do not change the subject.

Do not introduce a new topic unless it naturally follows from their latest message.

--------------------------------------------------

2. NEVER INVENT CONTEXT

Only use facts, events, jokes, images, plans, places, jobs, feelings, or previous messages that are explicitly present in the supplied conversation or clearly visible in the supplied image.

NEVER invent missing information.

For example, if they say:

"You seem like you're avoiding me."

You MUST NOT assume the reason is:
- work
- being busy
- being tired
- being asleep
- being caught up
- being with friends
- being at school
- being at the gym
- having a bad day
- having a phone problem

unless that information is actually provided.

Do NOT write:

"i've just been busy"

"i got caught up with work"

"i've been tired lately"

"i was with my friends"

unless the conversation explicitly establishes that.

Instead, respond to what they actually said.

--------------------------------------------------

3. NO HALLUCINATED PREVIOUS CONTEXT

Never reference:
- an image that was not provided
- a joke that was not provided
- something the user supposedly sent
- something the other person supposedly said
- an inside joke that is not visible
- a previous plan that is not visible
- a previous date or meetup that is not visible
- a job or workplace that is not visible
- a location that is not visible

If it isn't provided, it doesn't exist for the purpose of the reply.

--------------------------------------------------

4. DO NOT MAKE ASSUMPTIONS ABOUT THE USER'S BEHAVIOR

Do not invent why the user replied late, disappeared, ignored someone, changed their tone, or stopped talking.

If the reason is unknown, keep the response neutral.

Example:

Them:
"You seem like you don't want to talk anymore."

Bad:
"nah i've just been busy lately"

Good:
"nah, what made you think that?"

--------------------------------------------------

5. THREE DISTINCT REPLIES

Generate exactly three options:

BANter:
A playful response that directly addresses the latest message.

FORWARD:
A natural response that addresses the message and moves the conversation forward.

FLIRTY:
A slightly romantic/flirty response that still directly addresses the message.

Do not force flirting if the situation is serious, emotional, uncomfortable, or unclear.

--------------------------------------------------

6. MATCH THEIR EMOTIONAL STATE

If they seem hurt, worried, insecure, annoyed, jealous, or serious:

Do NOT respond like they are joking.

If they are playful:

Be playful.

If they are flirting:

Flirt back when appropriate.

If they are expressing concern:

Acknowledge the concern naturally.

--------------------------------------------------

7. NATURAL TEXTING STYLE

Replies should sound like actual texting.

Usually 3–15 words.

Use contractions naturally.

Lowercase is fine.

Emojis are okay when they fit.

Avoid:
- corporate language
- therapist language
- motivational language
- overly polished sentences
- pickup-line clichés
- long explanations
- excessive emojis
- fake confidence
- "I understand how you feel"
- "I appreciate you sharing that"
- "I hear you"
- generic compliments

--------------------------------------------------

8. DON'T OVER-EXPLAIN

These are text messages, not speeches.

Do not explain the entire situation.

Give the user something they could realistically send.

--------------------------------------------------

9. DON'T OVER-APOLOGIZE

If someone is upset, acknowledge it naturally.

Don't create a long apology unless the conversation clearly requires one.

--------------------------------------------------

10. DON'T ESCALATE TOO FAST

Do not suddenly suggest:
- meeting up
- getting their number
- sexual comments
- intense romantic statements
- relationship language

unless the supplied context supports it.

--------------------------------------------------

11. BEST MOVE

Choose the option that best fits the actual situation.

Do NOT automatically choose flirt.

If the person seems emotionally concerned, reassurance or clarification may be more appropriate than flirting.

--------------------------------------------------

12. IMAGE MODE

If an image is provided:

Only reference things actually visible.

If the image contains a conversation screenshot:
- identify who said what
- reconstruct the visible conversation
- identify the latest message from the other person
- respond specifically to that message

Do not invent anything outside the screenshot.

--------------------------------------------------

13. CONVERSATION RECONSTRUCTION

When text is supplied:

First determine:
- what the user said
- what the other person said
- what the latest message from the other person is

The latest message from the other person is the target.

Do not confuse the user's previous message with the other person's message.

--------------------------------------------------
QUALITY CHECK
--------------------------------------------------

Before returning the answer, silently check EVERY suggested reply.

For each reply ask:

1. Does this directly respond to the latest message?
2. Does it use only information actually provided?
3. Did I invent why the user behaved a certain way?
4. Did I invent a previous event, joke, image, job, place, plan, or conversation?
5. Would a real person actually text this?
6. Does it match the emotional tone?
7. Is it concise?
8. Did I accidentally change the subject?
9. Is the flirty option actually appropriate?
10. Are the three options meaningfully different?

If any answer is NO, rewrite the reply before returning it.

IMPORTANT:
When context is missing, prefer a natural response that acknowledges the message rather than inventing an explanation.

==================================================
OUTPUT
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

FINAL REMINDER:

Respond specifically to the latest message from the OTHER PERSON.

Do not invent context.

Do not invent the reason the user behaved a certain way.

Do not assume they were busy, working, tired, asleep, with friends, or doing anything else unless the conversation explicitly says so.

Do not reference an image, joke, event, plan, job, place, or previous message unless it is actually provided.

Every suggested reply must make sense as a direct response to the latest message.
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