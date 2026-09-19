"use client";

import { useState } from "react";

const vibes = [
  "Confident",
  "Funny",
  "Charming",
  "Flirty",
  "Teasing",
  "Chill",
];

const goals = [
  "Start talking",
  "Make them laugh",
  "Flirt",
  "Get their number",
  "Build a connection",
  "Ask them out",
];

const uploadTypes = ["Conversation", "Photo / Story"];

type Result = {
  situation: string;
  vibe: string;
  engagement: "High" | "Medium" | "Low";
  recommendedMove: string;
  banter: string;
  forward: string;
  flirty: string;
  bestMove: string;
  bestType: string;
  reason: string;
};

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 1280;

        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not process image"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function ReplyCard({
  label,
  text,
  description,
}: {
  label: string;
  text: string;
  description: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      // Ignore clipboard errors.
    }
  }

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-all hover:border-white/15 hover:bg-white/[0.05]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/80">{label}</p>

          <p className="mt-1 text-xs text-white/30">{description}</p>
        </div>

        <button
          onClick={copyReply}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <p className="text-[15px] leading-6 text-white/90">{text}</p>
    </div>
  );
}

function Radar({ engagement }: { engagement: Result["engagement"] }) {
  const width =
    engagement === "High"
      ? "w-full"
      : engagement === "Medium"
        ? "w-2/3"
        : "w-1/3";

  const color =
    engagement === "High"
      ? "bg-emerald-400"
      : engagement === "Medium"
        ? "bg-yellow-400"
        : "bg-red-400";

  const textColor =
    engagement === "High"
      ? "text-emerald-300"
      : engagement === "Medium"
        ? "text-yellow-300"
        : "text-red-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
            Rizzora Radar
          </p>

          <p className={`mt-1 text-sm font-semibold ${textColor}`}>
            {engagement} engagement
          </p>
        </div>

        <div className="text-xl">📡</div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${width} ${color}`}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("Confident");
  const [selectedGoal, setSelectedGoal] = useState("Start talking");
  const [uploadType, setUploadType] = useState("Conversation");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const isPhoto = uploadType === "Photo / Story";

  function handleUploadTypeChange(type: string) {
    setUploadType(type);
    setResult(null);
    setError("");

    if (type === "Conversation") {
      setImagePreview(null);
    }
  }

  async function handleImage(file: File) {
    try {
      setError("");

      const resized = await resizeImage(file);

      setImagePreview(resized);
    } catch {
      setError("Couldn't process that image. Try another one.");
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    handleImage(file);
  }

  async function generateRizz() {
    if (loading) return;

    if (!message.trim() && !imagePreview) {
      setError(
        isPhoto
          ? "Upload a photo or add some context first."
          : "Paste the recent conversation first."
      );

      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          vibe: selectedVibe,
          goal: selectedGoal,
          uploadType,
          image: imagePreview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyBestMove() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.bestMove);
    } catch {
      // Ignore clipboard errors.
    }
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-black">
                R
              </div>

              <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                RIZZORA
              </h1>
            </div>

            <p className="mt-1 text-xs text-white/35 sm:text-sm">
              Your AI wingman when you don&apos;t know what to say.
            </p>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/45 sm:block">
            AI WINGMAN
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 shadow-2xl shadow-black/30 sm:p-6">
          <div className="mb-5 flex rounded-xl border border-white/10 bg-black/20 p-1">
            {uploadTypes.map((type) => {
              const active = uploadType === type;

              return (
                <button
                  key={type}
                  onClick={() => handleUploadTypeChange(type)}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-black shadow-lg"
                      : "text-white/45 hover:text-white"
                  }`}
                >
                  {type === "Conversation" ? "💬" : "📸"} {type}
                </button>
              );
            })}
          </div>

          <div className="mb-5">
            {isPhoto ? (
              <>
                <label className="block cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black/20 transition hover:border-white/25 hover:bg-white/[0.025]">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Uploaded"
                          className="max-h-[420px] w-full object-contain"
                        />

                        <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
                          Tap to change photo
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[190px] flex-col items-center justify-center px-6 text-center sm:min-h-[230px]">
                        <div className="mb-3 text-4xl">📸</div>

                        <p className="font-semibold text-white/85">
                          Upload a photo or story
                        </p>

                        <p className="mt-1 max-w-sm text-sm leading-5 text-white/35">
                          Give RIZZORA the visual context and it&apos;ll
                          figure out what to say.
                        </p>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </label>

                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add context (optional)"
                    rows={3}
                    className="w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-6 text-white outline-none placeholder:text-white/25"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Paste the recent conversation here...

You: you going out tonight?
Them: maybe haha
You: what does maybe mean 😂
Them: haha maybe`}
                  rows={8}
                  className="w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-6 text-white outline-none placeholder:text-white/20"
                />

                <div className="border-t border-white/5 px-4 py-2.5">
                  <p className="text-xs text-white/25">
                    Tip: include a few messages before their latest reply so
                    RIZZORA understands the context.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-5">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                Vibe
              </p>

              <span className="text-xs text-white/25">
                How should it sound?
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {vibes.map((vibe) => {
                const active = selectedVibe === vibe;

                return (
                  <button
                    key={vibe}
                    onClick={() => setSelectedVibe(vibe)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/[0.025] text-white/50 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                Goal
              </p>

              <span className="text-xs text-white/25">
                What are you trying to do?
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {goals.map((goal) => {
                const active = selectedGoal === goal;

                return (
                  <button
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/[0.025] text-white/50 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={generateRizz}
            disabled={loading}
            className={`w-full rounded-2xl px-5 py-4 text-base font-black transition-all ${
              loading
                ? "cursor-wait bg-white/10 text-white/40"
                : "bg-white text-black shadow-xl shadow-black/20 hover:-translate-y-0.5 hover:bg-white/90 active:translate-y-0"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                RIZZORA IS COOKING...
              </span>
            ) : (
              "🔥 Generate Rizz"
            )}
          </button>

          {loading && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white/75">
                    Reading the conversation...
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Finding the best move for the situation.
                  </p>
                </div>

                <div className="text-xl">🧠</div>
              </div>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-white/50" />
              </div>
            </div>
          )}
        </section>

        {result && !loading && (
          <section className="mt-6 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                    Conversation Intelligence
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Here&apos;s the read.
                  </h2>
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/45">
                  {result.vibe}
                </div>
              </div>

              <p className="text-sm leading-6 text-white/65">
                {result.situation}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Radar engagement={result.engagement} />

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                    Recommended move
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/80">
                    {result.recommendedMove}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                  Your moves
                </p>

                <p className="mt-1 text-sm text-white/35">
                  Three different ways to play it.
                </p>
              </div>

              <div className="grid gap-3">
                <ReplyCard
                  label="Keep the banter"
                  description="Continue the energy already there"
                  text={result.banter}
                />

                <ReplyCard
                  label="Move it forward"
                  description="Give the conversation somewhere to go"
                  text={result.forward}
                />

                <ReplyCard
                  label="Add some flirt"
                  description="Create a little playful tension"
                  text={result.flirty}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/[0.055] p-5 shadow-xl shadow-black/20 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl text-black">
                  🔥
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                      Best Move
                    </p>

                    {result.bestType && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                        {result.bestType}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-base font-semibold leading-7 text-white">
                    {result.bestMove}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-white/40">
                    {result.reason}
                  </p>

                  <div className="mt-4">
                    <button
                      onClick={copyBestMove}
                      className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-white/90"
                    >
                      Copy best move
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="mt-8 text-center text-xs text-white/20">
          RIZZORA helps you sound natural — not like a pickup-line generator.
        </footer>
      </div>
    </main>
  );
}