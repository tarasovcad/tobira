import { Button } from "@/components/ui/button";

export function CloseButton({ className }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Close"
      onClick={() => window.close()}
      className={className}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.41321 3.41301C3.69723 3.12899 4.15771 3.12899 4.44173 3.41301L8.0002 6.97146L11.5587 3.41301C11.8427 3.12899 12.3032 3.12899 12.5872 3.41301C12.8712 3.69703 12.8712 4.15751 12.5872 4.44153L9.02874 8L12.5872 11.5585C12.8712 11.8425 12.8712 12.303 12.5872 12.587C12.3032 12.871 11.8427 12.871 11.5587 12.587L8.0002 9.02854L4.44173 12.587C4.15771 12.871 3.69723 12.871 3.41321 12.587C3.12919 12.303 3.12919 11.8425 3.41321 11.5585L6.97166 8L3.41321 4.44153C3.12919 4.15751 3.12919 3.69703 3.41321 3.41301Z"
          fill="currentColor"
        />
      </svg>
    </Button>
  );
}
