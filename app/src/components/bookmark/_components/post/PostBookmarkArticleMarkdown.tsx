"use client";

import Link from "next/link";
import {Fira_Code} from "next/font/google";
import ReactMarkdown, {type Components} from "react-markdown";
import {useTheme} from "next-themes";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {oneDark, oneLight} from "react-syntax-highlighter/dist/esm/styles/prism";
import {ScrollArea} from "@/components/ui/coss/scroll-area";
import {useClipboardCopy} from "@/lib/hooks/use-clipboard-copy";
import {toSafeHttpUrl} from "@/lib/utils/safe-url";
import {AnimatePresence, motion} from "motion/react";

type PostBookmarkArticleMarkdownProps = {
  data: unknown;
};

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500"],
});

const SYNTAX_HIGHLIGHTER_FONT_FAMILY = `${firaCode.style.fontFamily}, Menlo, Consolas, "DejaVu Sans Mono", monospace`;
const MARKDOWN_CODE_LANGUAGE_CLASS_NAME = /language-(\w+)/;

function CodeBlockCopyButton({code}: {code: string}) {
  const {copiedKey, copyText} = useClipboardCopy(2000, {toast: true});
  const copied = copiedKey === code;

  return (
    <button
      type="button"
      aria-label="Copy code"
      onClick={(event) => {
        event.stopPropagation();
        void copyText(code, code);
      }}
      className="hit-area-4 cursor-pointer">
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <AnimatedCopyIcon key="check" variant="check" />
        ) : (
          <AnimatedCopyIcon key="copy" variant="copy" />
        )}
      </AnimatePresence>
    </button>
  );
}

function AnimatedCopyIcon({variant}: {variant: "check" | "copy"}) {
  const isCheck = variant === "check";

  return (
    <motion.span
      className="flex items-center justify-center"
      initial={{opacity: 0, filter: `blur(${isCheck ? 2 : 4}px)`, scale: isCheck ? 0.9 : 0.85}}
      animate={{opacity: 1, filter: "blur(0px)", scale: 1}}
      exit={{opacity: 0, filter: "blur(4px)", scale: 0.85}}
      transition={{duration: isCheck ? 0.05 : 0.1, ease: "easeOut"}}>
      {isCheck ? <CheckIcon /> : <CopyIcon />}
    </motion.span>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 7.1731L5.625 10L10 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.16699 2.47916C1.16699 1.75428 1.75462 1.16666 2.47949 1.16666H8.02116C8.74601 1.16666 9.33366 1.75428 9.33366 2.47916V4.66666H11.5212C12.246 4.66666 12.8337 5.25428 12.8337 5.97916V11.5208C12.8337 12.2457 12.246 12.8333 11.5212 12.8333H5.97949C5.25462 12.8333 4.66699 12.2457 4.66699 11.5208V9.33332H2.47949C1.75462 9.33332 1.16699 8.74567 1.16699 8.02082V2.47916ZM8.16699 4.66666H5.97949C5.25462 4.66666 4.66699 5.25428 4.66699 5.97916V8.16666H2.47949C2.39895 8.16666 2.33366 8.10138 2.33366 8.02082V2.47916C2.33366 2.39862 2.39895 2.33332 2.47949 2.33332H8.02116C8.10172 2.33332 8.16699 2.39862 8.16699 2.47916V4.66666Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FencedCodeBlock({
  code,
  displayLanguage,
  syntaxLanguage,
}: {
  code: string;
  displayLanguage: string;
  syntaxLanguage: string;
}) {
  const {resolvedTheme} = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="overflow-hidden">
      <FencedCodeBlockHeader displayLanguage={displayLanguage} code={code} />

      <ScrollArea
        className="max-h-96"
        hideFocusRing
        scrollbarGutter
        viewportProps={{className: "cursor-text"}}>
        <SyntaxHighlighter
          language={syntaxLanguage}
          style={isDark ? oneDark : oneLight}
          className={firaCode.className}
          customStyle={getSyntaxHighlighterStyle(isDark)}
          codeTagProps={{
            className: "cursor-text text-[13px] leading-5",
            style: {fontFamily: SYNTAX_HIGHLIGHTER_FONT_FAMILY},
          }}>
          {code}
        </SyntaxHighlighter>
      </ScrollArea>
    </div>
  );
}

function FencedCodeBlockHeader({code, displayLanguage}: {code: string; displayLanguage: string}) {
  return (
    <div className="flex items-center justify-between rounded-t-xl bg-[#eef0f2] py-2 pr-3 pl-4 text-[13px] text-zinc-600 dark:bg-[#21252b] dark:text-zinc-400">
      <span className="min-h-5 min-w-[1ch]">{displayLanguage}</span>
      <CodeBlockCopyButton code={code} />
    </div>
  );
}

function getSyntaxHighlighterStyle(isDark: boolean) {
  return {
    background: isDark ? "hsl(220, 13%, 18%)" : "#F7F9F9",
    color: isDark ? "hsl(220, 14%, 71%)" : "rgb(56, 58, 66)",
    margin: 0,
    padding: "16px",
    fontSize: "13px",
    lineHeight: "20px",
    cursor: "text",
    fontFamily: SYNTAX_HIGHLIGHTER_FONT_FAMILY,
    borderRadius: "0px",
    overflow: "visible",
  };
}

const ARTICLE_MARKDOWN_COMPONENTS: Components = {
  a({children, href}) {
    const safeHref = toSafeHttpUrl(href);
    if (!safeHref) {
      return <span className="text-[#1D9BF0]">{children}</span>;
    }

    return (
      <Link
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="text-[#1D9BF0] hover:underline">
        {children}
      </Link>
    );
  },
  code({children, className}) {
    const code = String(children).replace(/\n$/, "");
    const displayLanguage = MARKDOWN_CODE_LANGUAGE_CLASS_NAME.exec(className ?? "")?.[1] ?? "";
    const isFencedBlock = className?.startsWith("language-") === true || code.includes("\n");

    if (isFencedBlock) {
      return (
        <FencedCodeBlock
          code={code}
          displayLanguage={displayLanguage}
          syntaxLanguage={displayLanguage || "text"}
        />
      );
    }

    return (
      <code className="bg-muted text-foreground rounded px-1 py-0.5 text-[0.92em]">{children}</code>
    );
  },
  p({children}) {
    return <p className="cursor-text px-4 py-3 whitespace-pre-wrap">{children}</p>;
  },
  pre({children}) {
    return <>{children}</>;
  },
};

export default function PostBookmarkArticleMarkdown({data}: PostBookmarkArticleMarkdownProps) {
  const markdown = getMarkdownEntityText(data);

  if (!markdown) {
    return null;
  }

  return (
    <div className="my-6">
      <ReactMarkdown components={ARTICLE_MARKDOWN_COMPONENTS}>{markdown}</ReactMarkdown>
    </div>
  );
}

function getMarkdownEntityText(data: unknown): string | null {
  if (!isRecord(data) || typeof data.markdown !== "string") {
    return null;
  }

  const markdown = data.markdown.trim();
  return markdown.length > 0 ? markdown : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
