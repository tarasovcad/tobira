"use client";

import {AnimatePresence, motion} from "framer-motion";
import {Loader2} from "lucide-react";

type VideoPlayerOverlaysProps = {
  isFastForwarding: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  minimal: boolean;
  showControls: boolean;
  showMainPlayIcon: boolean;
  onTogglePlay: () => void;
};

export function VideoPlayerOverlays({
  isFastForwarding,
  isLoading,
  isPlaying,
  minimal,
  showControls,
  showMainPlayIcon,
  onTogglePlay,
}: VideoPlayerOverlaysProps) {
  return (
    <>
      {isLoading && !minimal && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      <AnimatePresence>
        {isFastForwarding && (
          <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            transition={{duration: 0.2}}
            className="pointer-events-none absolute top-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md">
            <span>2x</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2.6665 4.80273C2.6665 3.65718 4.01573 3.04494 4.87784 3.79929L7.99984 6.53103V4.80273C7.99984 3.65718 9.34904 3.04494 10.2112 3.79929L13.8654 6.9968C14.4726 7.528 14.4726 8.47247 13.8654 9.00367L10.2112 12.2011C9.34904 12.9555 7.99984 12.3433 7.99984 11.1977V9.4694L4.87784 12.2011C4.01573 12.9555 2.6665 12.3433 2.6665 11.1977V4.80273Z"
                fill="currentColor"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isPlaying && !isLoading && showControls && showMainPlayIcon && (
          <motion.div
            initial={{opacity: 1, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.9}}
            transition={{duration: 0.2}}
            className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
            onClick={onTogglePlay}>
            <div
              className="absolute h-20 w-20 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
                filter: "blur(6px)",
              }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(24px) saturate(180%) brightness(1.1)",
                WebkitBackdropFilter: "blur(24px) saturate(180%) brightness(1.1)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                boxShadow:
                  "0 4px 32px rgba(0, 0, 0, 0.25), 0 1.5px 0px rgba(255,255,255,0.35) inset, 0 -1px 0px rgba(0,0,0,0.15) inset",
              }}>
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)",
                }}
              />
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))"}}>
                <path
                  d="M14.9293 3.62437C11.3828 1.2938 6.66699 3.83773 6.66699 8.08146V23.9183C6.66699 28.162 11.3828 30.7059 14.9293 28.3753L26.979 20.4569C30.1849 18.3503 30.1849 13.6495 26.979 11.5427L14.9293 3.62437Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
