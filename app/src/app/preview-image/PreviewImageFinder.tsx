"use client";

import React, {useState} from "react";
import {Input} from "@/components/coss-ui/input";
import {Button} from "@/components/shadcn/button";

type PreviewImageApiResponse = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  imageUrl?: string;
  images: Array<{
    url: string;
    source: "og" | "twitter";
    alt?: string;
    type?: string;
    width?: number;
    height?: number;
  }>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isPreviewImageApiResponse(v: unknown): v is PreviewImageApiResponse {
  if (!isRecord(v)) return false;
  if (typeof v.inputUrl !== "string") return false;
  if (typeof v.normalizedUrl !== "string") return false;
  if (!Array.isArray(v.images)) return false;
  return true;
}

const PreviewImageFinder = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PreviewImageApiResponse | null>(null);

  const onSubmit = async () => {
    const input = url.trim();
    if (!input) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/preview-image?url=${encodeURIComponent(input)}`, {
        method: "GET",
      });

      const json: unknown = await res.json();
      if (!res.ok) {
        const maybeError =
          isRecord(json) && typeof json.error === "string" ? json.error : "Request failed";
        setError(maybeError);
        return;
      }

      if (!isPreviewImageApiResponse(json)) {
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
        <div className="text-sm font-medium">Website image preview</div>
        <div className="text-muted-foreground text-xs">Enter a URL to fetch an image preview</div>
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
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">Resolved URL</div>
            <a
              href={data.finalUrl ?? data.normalizedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm break-all underline underline-offset-4">
              {data.finalUrl ?? data.normalizedUrl}
            </a>
          </div>

          {data.images.length ? (
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">
                Found {data.images.length} image(s)
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.images.map((img) => {
                  const meta = [
                    img.source.toUpperCase(),
                    img.type,
                    img.width && img.height ? `${img.width}×${img.height}` : undefined,
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <a
                      key={img.url}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block overflow-hidden rounded-md border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt ?? "Website image"}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5 p-2">
                        <div className="text-muted-foreground text-[11px]">{meta || "Image"}</div>
                        {img.alt ? <div className="line-clamp-2 text-xs">{img.alt}</div> : null}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : data.imageUrl ? (
            // Fallback: older API responses might only provide `imageUrl`.
            <a href={data.imageUrl} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageUrl}
                alt="Website image preview"
                className="aspect-video w-full rounded-md border object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </a>
          ) : (
            <div className="text-muted-foreground text-sm">No image found.</div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default PreviewImageFinder;
