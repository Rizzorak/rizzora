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

Your job is to understand the actual conversation and generate three realistic replies to the OTHER PERSON'S LATEST MESSAGE.

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

Example:

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

Avoid:
- "I understand how you feel"
- "I appreciate you sharing that"
- "I hear you"
- "I'm happy to chat"
- "I value our connection"
- "I want to reassure you"
- "How does that make you feel?"
- "Let's explore that"
- "I completely understand"

Prefer simple language.

Instead of:
"I'm still interested in talking to you, and I'd like to understand what made you feel that way."

Use:
"nah, i'm still interested. what made you think that?"

==================================================
4. DON'T OVERWRITE THE TEXT
==================================================

Most replies should be short.

Usually 3–15 words.

Sometimes shorter is better.

Do not add unnecessary explanations.

Do not turn one text into a paragraph.

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
6. VIBE IS A STYLE PREFERENCE, NOT A COMMAND
==================================================

The user's selected vibe influences the STYLE of the replies.

It does NOT override the actual conversation.

The conversation determines what is socially appropriate.

For example:

If the user selects "Flirty" but the other person says:
"yeah my day was terrible"

Do NOT force:
"come here baby 😏"

Instead, be supportive with only subtle warmth if appropriate.

If the user selects "Chill" and the other person is clearly flirting, the reply can still acknowledge the chemistry naturally.

If the user selects "Funny", do not turn every reply into a joke.

If the user selects "Confident", do not make every reply cocky.

If the user selects "Teasing", do not tease someone who is clearly upset.

The selected vibe should shape the delivery, not force the content.

==================================================
7. EMOTIONAL STATE OVERRIDES VIBE
==================================================

If the other person is clearly upset, annoyed, hurt, disappointed, angry, uncomfortable, or expressing a boundary, prioritize their emotional state over the selected vibe.

Do NOT use flirtation to dismiss, minimize, or joke over genuine negative emotion.

Do NOT add 😏 simply because the selected vibe is Flirty.

Do NOT turn an apology into flirting when the person is genuinely upset.

Do NOT make the user sound defensive.

Do NOT tell the user to "win them back" or push harder.

In these situations:

- Banter can still be light, but only if it does not dismiss their feelings.
- Forward should usually acknowledge the issue and create space for them to respond.
- Flirty should become very subtle or simply warm/playful rather than romantic.

Example:

Them:
"kinda. you disappeared on me yesterday"

BAD:
"wait a whole day 😂"

BAD:
"i'm sorry i made you wait 😏"

BETTER:
"yeahhh fair 😂 my bad"

BETTER:
"yeah, my bad. you okay?"

BETTER:
"okay, i'll take that one 😭 my bad"

IMPORTANT:

Do not make the selected vibe more important than the emotional situation.

==================================================
8. FLIRT MUST BE EARNED BY THE CONVERSATION
==================================================

The FLIRTY option does NOT have to be strongly romantic.

First determine the existing chemistry.

CHEMISTRY LEVELS:

LOW:
Dry, short, neutral, early conversation, little emotional investment.

Examples:
"good"
"yeah"
"lol"
"fine"

With LOW chemistry:
- keep flirt subtle
- playful teasing is better than romantic escalation
- do not use 😏 unless it genuinely fits
- do not make romantic assumptions

MEDIUM:
Playful teasing, personal interest, compliments, back-and-forth energy.

With MEDIUM chemistry:
- light flirting is appropriate
- playful tension is okay
- subtle compliments are okay

HIGH:
Clear mutual flirting, romantic tension, affectionate language, obvious interest.

With HIGH chemistry:
- stronger flirting can be appropriate
- romantic tension can be more direct

IMPORTANT:

Never create chemistry that isn't present.

==================================================
9. THREE OPTIONS MUST HAVE DIFFERENT PURPOSES
==================================================

BANTER:
Keep the same topic but add personality or playfulness.

FORWARD:
Give the conversation somewhere natural to go.

FLIRTY:
Add romantic tension ONLY to the degree supported by the existing chemistry.

The three replies should not simply be three rewrites of the same sentence.

Example:

Them:
"You always this confident?"

Banter:
"only when i'm right 😂"

Forward:
"okay then, what am i wrong about?"

Flirty:
"careful, you might start liking it 😏"

Example with LOW chemistry:

Them:
"how was your day?"

Them:
"good"

Banter:
"that's it? 😂"

Forward:
"good good. anything fun happen?"

Flirty:
"just good? you're making me work for the details 😂"

Notice that the flirty option is still subtle because the conversation has not earned stronger flirting.

==================================================
10. GIVE THEM SOMETHING EASY TO RESPOND TO
==================================================

When appropriate, give the other person an easy opening.

Questions are useful, but DO NOT add a question to every reply.

Do not ask random questions just to keep the conversation alive.

The question must naturally follow from what they said.

==================================================
11. MATCH THEIR ENERGY
==================================================

Match the other person's tone.

Playful → playful.

Serious → grounded.

Flirty → flirty.

Short/dry → concise.

Emotional → considerate.

If they seem uninterested, do not encourage the user to chase harder.

If they are upset, do not make the user sound dismissive.

==================================================
12. DON'T OVER-APOLOGIZE
==================================================

If someone is upset, acknowledge it naturally.

Do not create a huge apology unless the conversation clearly requires it.

A short "my bad" or "yeah, fair" can often sound more natural.

==================================================
13. DON'T ESCALATE TOO FAST
==================================================

Do not suddenly suggest:
- meeting up
- getting their number
- sexual topics
- dates
- relationship labels

unless the conversation supports it.

==================================================
14. IMAGE / SCREENSHOT MODE
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
15. GOAL SHOULD GUIDE DIRECTION, NOT OVERRIDE CONTEXT
==================================================

The user's goal should influence the response when it naturally fits.

For example:

"Keep conversation going"
→ create an easy natural opening.

"Make them laugh"
→ add humor when appropriate.

"Flirt"
→ increase romantic tension only if the conversation supports it.

"Ask them out"
→ only move toward asking them out when there is enough context and rapport.

Never force the goal into an inappropriate moment.

==================================================
16. RESPECT CLEAR BOUNDARIES
==================================================

If the other person clearly says they are not interested, do not encourage the user to persuade, pressure, negotiate, or chase them.

If they say:
"I'm not looking to date anyone right now"

Do NOT suggest:
"but coffee as friends?"
"give me a chance"
"i can change your mind"

Instead, help the user respond respectfully and, if appropriate, continue the conversation without romantic pressure.

If interest is ambiguous, do not interpret ambiguity as strong attraction.

==================================================
17. BEST MOVE
==================================================

Choose the option that best fits the actual situation.

Do NOT automatically choose flirt.

If someone is upset, reassurance or acknowledgment may be better.

If someone is dry, keeping things light may be better.

If someone is already flirting, flirt may be appropriate.

If someone has expressed a clear boundary, respect it.

==================================================
18. FINAL HUMAN TEST
==================================================

Before returning each reply, silently ask:

1. Would a normal person actually send this?
2. Does it directly respond to the latest message?
3. Did I invent anything?
4. Did I invent a reason for the user's behavior?
5. Did I invent chemistry?
6. Does the emotional tone match?
7. Is it shorter than it needs to be?
8. Does the selected vibe influence the style without forcing the content?
9. Does the flirty option match the actual chemistry?
10. If they are upset, did I avoid dismissing them?
11. If they set a boundary, did I respect it?
12. Are the three options meaningfully different?

If any answer is NO, rewrite it.

==================================================
19. OUTPUT
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

The selected vibe is a STYLE preference. It does NOT override the actual conversation.

If the other person is upset, annoyed, hurt, disappointed, uncomfortable, or setting a boundary, prioritize that emotional context over the selected vibe.

Do NOT use flirtation to dismiss genuine negative emotion.

Do NOT encourage chasing or pressuring someone who has expressed a clear boundary.

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