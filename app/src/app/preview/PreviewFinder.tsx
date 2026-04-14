"use client";
import React, {useState} from "react";
import {Input} from "@/components/coss-ui/input";
import {Button} from "@/components/shadcn/button";

type PreviewApiResponse = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  // Prefer `og:image`-like URL; can be a screenshot later if you decide to generate one server-side.
  imageUrl?: string;
  screenshotDataUrl?: string;
  screenshotError?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isPreviewApiResponse(v: unknown): v is PreviewApiResponse {
  return isRecord(v) && typeof v.inputUrl === "string" && typeof v.normalizedUrl === "string";
}

const PreviewFinder = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PreviewApiResponse | null>(null);

  const onSubmit = async () => {
    const input = url.trim();
    if (!input) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(input)}`, {
        method: "GET",
      });

      const json: unknown = await res.json();
      if (!res.ok) {
        const maybeError =
          isRecord(json) && typeof json.error === "string" ? json.error : "Request failed";
        setError(maybeError);
        return;
      }

      if (!isPreviewApiResponse(json)) {
        setError("Unexpected response shape");
        return;
      }

      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[520px] flex-col items-stretch justify-center gap-3">
      <div className="space-y-1">
        <div className="text-sm font-medium">Website preview</div>
        <div className="text-muted-foreground text-xs">
          Enter a URL to fetch title/description and a preview image.
        </div>
      </div>

      <form
        className="flex w-full items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}>
        <Input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? "Loading..." : "Submit"}
        </Button>
      </form>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      {data ? (
        <div className="space-y-3 pt-2">
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">OG image</div>
            {data.imageUrl ? (
              <a href={data.imageUrl} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.imageUrl}
                  alt={data.title ? `OG image for ${data.title}` : "OG image"}
                  className="aspect-video w-full rounded-md border object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </a>
            ) : (
              <div className="text-muted-foreground text-sm">No OG image found.</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">Browserless screenshot</div>
            {data.screenshotError ? (
              <div className="text-sm text-red-500">{data.screenshotError}</div>
            ) : data.screenshotDataUrl ? (
              <a href={data.screenshotDataUrl} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.screenshotDataUrl}
                  alt={data.title ? `Screenshot for ${data.title}` : "Website screenshot"}
                  className="aspect-video w-full rounded-md border object-cover"
                  loading="lazy"
                />
              </a>
            ) : (
              <div className="text-muted-foreground text-sm">No screenshot returned.</div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Title</div>
            <div className="text-sm">{data.title ?? "—"}</div>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Description</div>
            <div className="text-sm">{data.description ?? "—"}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PreviewFinder;
