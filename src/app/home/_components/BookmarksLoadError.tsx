import {cn} from "@/lib/utils/classnames";

type LoadError =
  | {
      message?: string;
      details?: string | null;
    }
  | null
  | undefined;

export function BookmarksLoadError({error}: {error: LoadError}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
      <div
        className={cn(
          "bg-destructive/10 text-destructive mb-4 flex h-12 w-12 items-center justify-center rounded-full",
        )}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 14.7998C11.3926 14.7998 10.9006 15.2921 10.9004 15.8994C10.9004 16.5069 11.3925 17 12 17C12.6075 16.9999 13.0996 16.5069 13.0996 15.8994C13.0994 15.2921 12.6073 14.7999 12 14.7998ZM12 7C11.4575 7 11.0271 7.45647 11.0586 7.99805L11.3125 12.3516C11.334 12.7157 11.6352 13 12 13C12.3648 13 12.666 12.7157 12.6875 12.3516L12.9414 7.99805C12.9729 7.45647 12.5425 7 12 7Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <h2 className="text-foreground text-xl font-semibold tracking-tight">
        Failed to load bookmarks
      </h2>
      <p className="text-secondary mt-2 max-w-[600px] text-sm leading-relaxed">
        We encountered an unexpected error while trying to fetch your bookmarks. This could be due
        to a temporary connection issue or a server error. Please try refreshing the page.
      </p>
      <details className="group mt-6">
        <summary
          className={cn(
            "text-secondary hover:text-foreground inline-flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-sm font-medium transition-all select-none",
          )}>
          Load more
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-open:rotate-180">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="animate-in fade-in slide-in-from-top-2 mt-4 text-left duration-200">
          <div className="bg-muted/50 border-border max-w-[450px] overflow-hidden rounded-xl border text-left">
            <div className="border-border bg-muted/30 text-secondary border-b px-4 py-2 text-sm font-medium">
              Error Details
            </div>
            <div className="p-4">
              <p className="text-destructive/90 tex-sm font-mono leading-relaxed break-all">
                {error?.message || "No specific error message provided."}
                {error?.details ? (
                  <span className="border-destructive/10 mt-2 block border-t pt-2 text-sm opacity-70">
                    {error.details}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
