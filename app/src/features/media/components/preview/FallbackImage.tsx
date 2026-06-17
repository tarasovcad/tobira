import Image, {type ImageProps} from "next/image";
import {useState} from "react";
import {cn} from "@/lib/utils";

type FallbackImageProps = ImageProps & {
  avatar?: boolean;
  displayFallbackSvg?: boolean;
  parentClassName?: string;
};

function ImageFallback() {
  return (
    <div className="text-muted-foreground/30 bg-muted absolute inset-0 flex items-center justify-center">
      <svg
        width="24"
        height="24"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.375 2.5C16.1009 2.5 17.5 3.89911 17.5 5.625V14.375C17.5 16.1009 16.1009 17.5 14.375 17.5H5.625C3.89911 17.5 2.5 16.1009 2.5 14.375V5.625C2.5 3.89911 3.89911 2.5 5.625 2.5H14.375ZM7.99235 11.3257C7.26015 10.5937 6.07318 10.5937 5.34098 11.3257L3.75 12.9167V14.375C3.75 15.4105 4.58947 16.25 5.625 16.25H12.9167L7.99235 11.3257ZM12.5 5.41667C11.3494 5.41667 10.4167 6.34941 10.4167 7.5C10.4167 8.65058 11.3494 9.58333 12.5 9.58333C13.6506 9.58333 14.5833 8.65058 14.5833 7.5C14.5833 6.34941 13.6506 5.41667 12.5 5.41667Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export function AvatarFallback() {
  return (
    <svg
      className="text-muted-foreground/20 h-full w-full"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_668_7)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20 0C31.0468 0 40 8.95434 40 20C40 31.0456 31.0468 40 20 40C8.95312 40 0 31.0456 0 20C0 8.95434 8.95312 0 20 0ZM20 26C15.2109 26 11.2344 28.011 8.57032 31.1992C11.4765 34.162 15.5237 36 20 36C24.4764 36 28.5234 34.162 31.4296 31.1992C28.7656 28.011 24.789 26 20 26ZM20 9.5C16.409 9.5 13.5 12.4102 13.5 16C13.5 19.5898 16.409 22.5 20 22.5C23.591 22.5 26.5 19.5898 26.5 16C26.5 12.4102 23.591 9.5 20 9.5Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_668_7">
          <rect width="40" height="40" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function FallbackImage({
  src,
  alt,
  avatar = false,
  className,
  parentClassName,
  onLoad,
  onError,
  displayFallbackSvg = true,
  ...props
}: FallbackImageProps) {
  const [imageStatus, setImageStatus] = useState<{
    src: ImageProps["src"];
    status: "loading" | "loaded" | "error";
  }>({src, status: "loading"});

  const status = imageStatus.src === src ? imageStatus.status : "loading";
  const isLoaded = status === "loaded";
  const hasError = status === "error";

  return (
    <div className={cn("relative h-full w-full overflow-hidden", parentClassName)}>
      {hasError ? (
        avatar ? (
          <AvatarFallback />
        ) : displayFallbackSvg ? (
          <ImageFallback />
        ) : null
      ) : null}

      <Image
        {...props}
        src={src}
        alt={alt}
        className={cn(
          className,
          "transition-opacity duration-200 ease-in-out",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={(event) => {
          setImageStatus({src, status: "loaded"});
          onLoad?.(event);
        }}
        onError={(event) => {
          setImageStatus({src, status: "error"});
          onError?.(event);
        }}
      />
    </div>
  );
}
