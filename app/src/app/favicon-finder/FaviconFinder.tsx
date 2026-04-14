"use client";
import React, {useState} from "react";
import {Input} from "@/components/coss-ui/input";
import {Button} from "@/components/shadcn/button";

type FaviconApiResponse = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  baseUrl?: string;
  icons: Array<{
    url: string;
    rel?: string;
    sizes?: string;
    type?: string;
    source: "html" | "manifest" | "fallback";
  }>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFaviconApiResponse(v: unknown): v is FaviconApiResponse {
  return (
    isRecord(v) &&
    typeof v.inputUrl === "string" &&
    typeof v.normalizedUrl === "string" &&
    Array.isArray(v.icons)
  );
}

const FaviconFinder = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FaviconApiResponse | null>(null);

  const onSubmit = async () => {
    const input = url.trim();
    if (!input) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/favicons?mode=all&url=${encodeURIComponent(input)}`, {
        method: "GET",
      });

      const json: unknown = await res.json();
      if (!res.ok) {
        const maybeError =
          isRecord(json) && typeof json.error === "string" ? json.error : "Request failed";
        setError(maybeError);
        return;
      }

      if (!isFaviconApiResponse(json)) {
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
    <div className="mx-auto flex h-full w-full max-w-[300px] flex-col items-center justify-center gap-2">
      <Input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button type="submit" size="sm" className="w-full" disabled={isLoading} onClick={onSubmit}>
        {isLoading ? "Loading..." : "Submit"}
      </Button>

      {error ? <div className="w-full text-sm text-red-500">{error}</div> : null}

      {data ? (
        <div className="w-full space-y-2 pt-2">
          <div className="text-muted-foreground text-xs">Found {data.icons.length} icon(s)</div>
          <div className="grid w-full grid-cols-4 gap-2">
            {data.icons.map((icon) => (
              <a
                key={icon.url}
                href={icon.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-md border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={icon.url}
                  alt={icon.rel ?? icon.source ?? "favicon"}
                  width={32}
                  height={32}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FaviconFinder;
