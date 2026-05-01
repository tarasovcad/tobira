"use client";

import {Button} from "@/components/ui/coss/button";

export const CookiesOption = () => (
  <>
    <p className="text-muted-foreground mb-3 text-[13.5px] leading-relaxed">
      Open DevTools <span className="text-muted-foreground/50">›</span> Application{" "}
      <span className="text-muted-foreground/50">›</span> Cookies{" "}
      <span className="text-muted-foreground/50">›</span> x.com and copy these two values:
    </p>
    <div className="border-border mb-3 divide-y overflow-hidden rounded-[8px] border">
      {["auth_token", "ct0"].map((key, i) => (
        <div key={key} className="flex items-center gap-3 px-3 py-2.5">
          <div className="text-muted-foreground/50 shrink-0">
            {i === 0 ? (
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1a2.5 2.5 0 0 1 .5 4.95V7H8v1.5H6.5V10h-1V8.5H4V7h1.5V5.95A2.5 2.5 0 0 1 6 1z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <rect
                  x="2"
                  y="5"
                  width="8"
                  height="6"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.1"
                />
                <path
                  d="M4 5V3.5a2 2 0 0 1 4 0V5"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
          <code className="text-foreground/80 flex-1 font-mono text-[13px]">{key}</code>
          <span className="text-muted-foreground/40 font-mono text-[12px] tracking-widest">
            ••••••••
          </span>
        </div>
      ))}
    </div>
    <p className="text-muted-foreground/60 mb-3 text-[12.5px]">
      The <code className="text-foreground/60">ct0</code> cookie also acts as the CSRF token and
      must be submitted alongside <code className="text-foreground/60">auth_token</code>.
    </p>
    <Button size="sm" className="w-full">
      Enter Session Cookies
    </Button>
  </>
);
