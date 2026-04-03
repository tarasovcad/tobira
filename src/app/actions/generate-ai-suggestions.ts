"use server";

import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";
import {z} from "zod";
import {requireAuthenticatedUserId} from "@/lib/auth-session";
import {fetchUrlMetadata} from "@/lib/bookmarks/metadata";
import {normalizeTagNames} from "@/lib/utils";
import {normalizeInputUrl} from "@/lib/web-fetch";

const MAX_AI_TAG_SUGGESTIONS = 10;
const DEFAULT_AI_TAG_SUGGESTIONS = 5;
const MAX_TAG_LENGTH = 64;

const aiTagSuggestionsSchema = z.object({
  suggestions: z.array(z.string().min(1).max(MAX_TAG_LENGTH)).max(MAX_AI_TAG_SUGGESTIONS),
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type GenerateAiSuggestionsInput = {
  url: string;
  type: "website" | "media" | "article";
  existingTags?: string[];
  userTags?: string[];
  userAiContext?: string | null;
  maxSuggestions?: number;
};

export type GenerateAiSuggestionsResult = {
  suggestions: string[];
};

function formatDurationMs(durationMs: number) {
  return `${durationMs.toFixed(1)}ms`;
}

function clampSuggestionCount(value?: number) {
  if (!Number.isFinite(value)) return DEFAULT_AI_TAG_SUGGESTIONS;
  const normalized = Math.floor(value as number);
  return Math.min(MAX_AI_TAG_SUGGESTIONS, Math.max(1, normalized));
}

function normalizeGeneratedTags(rawTags: string[], existingTags: string[], maxSuggestions: number) {
  const existing = new Set(existingTags.map((tag) => tag.toLowerCase()));

  return normalizeTagNames(rawTags)
    .map((tag) => (tag.length > MAX_TAG_LENGTH ? tag.slice(0, MAX_TAG_LENGTH) : tag))
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    })
    .slice(0, maxSuggestions);
}

export async function generateAiSuggestions(
  input: GenerateAiSuggestionsInput,
): Promise<GenerateAiSuggestionsResult> {
  const requestStartedAt = performance.now();
  await requireAuthenticatedUserId();

  if (input.type !== "website") {
    throw new Error("AI suggestions are only available for website items.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  let normalizedUrl: URL;
  try {
    normalizedUrl = normalizeInputUrl(input.url);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Invalid URL.");
  }

  const metadataStartedAt = performance.now();
  const metadata = await fetchUrlMetadata(normalizedUrl, input.url);
  const metadataDurationMs = performance.now() - metadataStartedAt;
  const title = metadata.title?.trim();
  const description = metadata.description?.trim();

  if (!title && !description) {
    const totalDurationMs = performance.now() - requestStartedAt;
    console.log("[generateAiSuggestions] timings", {
      metadata: formatDurationMs(metadataDurationMs),
      ai: formatDurationMs(0),
      total: formatDurationMs(totalDurationMs),
      url: metadata.finalUrl ?? metadata.normalizedUrl,
      suggestions: 0,
    });

    return {suggestions: []};
  }

  const maxSuggestions = clampSuggestionCount(input.maxSuggestions);
  const existingTags = normalizeTagNames(input.existingTags ?? []);
  const userTags = normalizeTagNames(input.userTags ?? []);
  const userAiContext = input.userAiContext?.trim();

  const aiStartedAt = performance.now();
  const completion = await openaiClient.chat.completions.parse({
    model: "gpt-5-nano",
    reasoning_effort: "minimal",
    max_completion_tokens: 120,
    response_format: zodResponseFormat(aiTagSuggestionsSchema, "bookmark_tag_suggestions"),
    messages: [
      {
        role: "system",
        content: [
          "You generate concise bookmark tags for a personal link library.",
          "Return short, reusable tags without a leading # character.",
          "Prefer lowercase, 1-3 words, and avoid duplicates or near-duplicates.",
          "Prefer single-word tags for most suggestions, roughly 70% of the time, unless a multi-word tag is clearly more accurate.",
          "Prefer natural space-separated tags for multi-word phrases instead of hyphenated slugs.",
          "Use broad but useful categories, technologies, topics, and intent labels.",
          "Do not invent tags unsupported by the provided page metadata.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `URL: ${metadata.finalUrl ?? metadata.normalizedUrl}`,
          `Title: ${title ?? "Unknown"}`,
          `Description: ${description ?? "Unknown"}`,
          userAiContext ? `User AI context: ${userAiContext}` : null,
          userTags.length > 0
            ? `User tag vocabulary to prefer when relevant: ${userTags.join(", ")}`
            : null,
          existingTags.length > 0 ? `Existing tags to avoid: ${existingTags.join(", ")}` : null,
          `Return up to ${maxSuggestions} tags.`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  const aiDurationMs = performance.now() - aiStartedAt;
  const parsed = completion.choices[0]?.message.parsed;
  const suggestions = normalizeGeneratedTags(
    parsed?.suggestions ?? [],
    existingTags,
    maxSuggestions,
  );
  const totalDurationMs = performance.now() - requestStartedAt;

  console.log("[generateAiSuggestions] timings", {
    metadata: formatDurationMs(metadataDurationMs),
    ai: formatDurationMs(aiDurationMs),
    total: formatDurationMs(totalDurationMs),
    url: metadata.finalUrl ?? metadata.normalizedUrl,
    suggestions: suggestions.length,
  });

  return {
    suggestions,
  };
}
