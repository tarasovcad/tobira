"use client";

import {cn} from "@/lib/utils";
import {AnimatePresence, motion} from "motion/react";
import {Fragment} from "react";

export type XSetupStep = 1 | 2 | 3 | 4;

const STEPS: {
  id: XSetupStep;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}[] = [
  {
    id: 1,
    label: "About",
    icon: ({className}) => (
      <svg className={className} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5.83301 6.08334H6.83365V11.0833"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.83251 2.33333C6.41805 2.33333 6.08203 2.66912 6.08203 3.08333C6.08203 3.49754 6.41805 3.83333 6.83251 3.83333C7.24698 3.83333 7.58299 3.49754 7.58299 3.08333C7.58299 2.66912 7.24698 2.33333 6.83251 2.33333Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.8"
        />
      </svg>
    ),
  },
  {
    id: 2,
    label: "Connect",
    icon: () => (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.77124 5.32098C4.91027 4.18195 6.75699 4.18195 7.896 5.32098L8.0962 5.52115C8.57238 5.9973 8.84999 6.59872 8.92774 7.21938C8.96782 7.53905 8.74114 7.83066 8.42147 7.87067C8.1018 7.91075 7.81019 7.68407 7.77012 7.3644C7.72345 6.99194 7.55761 6.63249 7.27125 6.34613L7.07105 6.14593C6.38768 5.46252 5.27961 5.46252 4.5962 6.14593L2.64603 8.09613C1.96261 8.77951 1.96261 9.88755 2.64603 10.571L2.8462 10.7711C3.52961 11.4546 4.63765 11.4546 5.32107 10.7711L5.42113 10.6711C5.64893 10.4432 6.01825 10.4432 6.2461 10.671C6.47389 10.8988 6.47389 11.2682 6.2461 11.496L6.14606 11.5961C5.00702 12.7351 3.16026 12.7351 2.02124 11.5961L1.82107 11.3959C0.682042 10.2569 0.682036 8.4102 1.82107 7.27112L3.77124 5.32098Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.85466 2.98766C8.99368 1.84864 10.8405 1.84864 11.9795 2.98766L12.1796 3.18783C13.3187 4.32686 13.3187 6.1736 12.1796 7.31262L10.2295 9.26282C9.09045 10.4018 7.24368 10.4018 6.10466 9.26276L5.90452 9.06262C5.42834 8.58645 5.1507 7.98509 5.07294 7.36442C5.0329 7.04475 5.25958 6.75314 5.57925 6.71307C5.89892 6.67305 6.19053 6.89974 6.23055 7.2194C6.27721 7.59186 6.44305 7.95125 6.72947 8.23767L6.92961 8.43781C7.61305 9.12125 8.72109 9.12125 9.40452 8.43781L11.3547 6.48767C12.0381 5.80425 12.0381 4.69621 11.3547 4.01279L11.1545 3.81263C10.4711 3.12922 9.36311 3.1292 8.67967 3.81257C8.67973 3.81255 8.67967 3.81258 8.67967 3.81257L8.57963 3.91265C8.35184 4.14049 7.98253 4.14053 7.75468 3.91276C7.52683 3.68498 7.52677 3.31564 7.75456 3.0878L7.85466 2.98766Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 3,
    label: "Preferences",
    icon: () => (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10.4997 7.65677C11.5063 7.91572 12.2497 8.82904 12.2497 9.91667C12.2497 11.2057 11.2054 12.25 9.91634 12.25C8.62729 12.25 7.58301 11.2057 7.58301 9.91667C7.58301 8.82904 8.32641 7.91572 9.33301 7.65677V2.33333C9.33301 2.01116 9.59417 1.75 9.91634 1.75C10.2385 1.75 10.4997 2.01116 10.4997 2.33333V7.65677Z"
          fill="currentColor"
        />
        <path
          d="M4.08333 12.25C3.76117 12.25 3.5 11.9888 3.5 11.6667V7.50989C2.49341 7.25095 1.75 6.33762 1.75 5.25C1.75 4.1624 2.49341 3.24903 3.5 2.99012V2.33333C3.5 2.01117 3.76117 1.75 4.08333 1.75C4.4055 1.75 4.66667 2.01117 4.66667 2.33333V2.99012C5.67325 3.24903 6.41667 4.1624 6.41667 5.25C6.41667 6.33762 5.67325 7.25095 4.66667 7.50989V11.6667C4.66667 11.9888 4.4055 12.25 4.08333 12.25Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 4,
    label: "Review",
    icon: () => (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.0002 2.33334C9.21903 2.33333 11.3793 3.56226 12.8727 5.89973C13.3008 6.56963 13.3008 7.43033 12.8727 8.10023C11.3793 10.4377 9.21903 11.6667 7.0002 11.6667C4.78137 11.6667 2.62113 10.4378 1.12766 8.10029C0.699634 7.43039 0.699634 6.56969 1.12766 5.89979C2.62113 3.56232 4.78136 2.33336 7.0002 2.33334ZM4.95854 7.00001C4.95854 5.87243 5.87262 4.95834 7.0002 4.95834C8.12778 4.95834 9.04187 5.87243 9.04187 7.00001C9.04187 8.12759 8.12778 9.04168 7.0002 9.04168C5.87262 9.04168 4.95854 8.12759 4.95854 7.00001Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

interface XSetupStepperProps {
  currentStep: XSetupStep;
}

export function XSetupStepper({currentStep}: XSetupStepperProps) {
  return (
    <div className="flex w-full items-center px-6 py-4">
      {STEPS.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isUpcoming = step.id > currentStep;
        const Icon = step.icon;
        const isLast = index === STEPS.length - 1;

        return (
          <Fragment key={step.id}>
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-6.5 items-center justify-center rounded-full transition-all duration-200",
                  isCompleted && "bg-foreground/95 text-primary-foreground ring-primary/20 ring-1",
                  isActive && "bg-foreground/95 text-primary-foreground ring-primary/25 ring-[1px]",
                  isUpcoming && "bg-background text-muted-foreground ring-border ring-1",
                )}>
                <AnimatePresence mode="wait" initial={false}>
                  {isCompleted ? (
                    <motion.svg
                      key="check"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      initial={{opacity: 0, scale: 0.6, filter: "blur(6px)"}}
                      animate={{opacity: 1, scale: 1, filter: "blur(0px)"}}
                      exit={{opacity: 0, scale: 0.6, filter: "blur(6px)"}}
                      transition={{duration: 0.1, ease: [0.25, 0.46, 0.45, 0.94]}}>
                      <path
                        d="M2.91699 7.4375L5.83366 11.0833L11.0837 2.91667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={{opacity: 0, scale: 0.6, filter: "blur(6px)"}}
                      animate={{opacity: 1, scale: 1, filter: "blur(0px)"}}
                      exit={{opacity: 0, scale: 0.6, filter: "blur(6px)"}}
                      transition={{duration: 0.1, ease: [0.25, 0.46, 0.45, 0.94]}}>
                      <Icon
                        className={cn("size-3.5", isActive ? "opacity-100" : "opacity-60")}
                        aria-hidden="true"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap transition-colors",
                  isActive && "text-foreground",
                  isCompleted && "text-foreground",
                  isUpcoming && "text-muted-foreground",
                )}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="relative mx-3 mb-5 h-px flex-1">
                <div className="bg-border absolute inset-0 rounded-full" />
                <div
                  className={cn(
                    "bg-primary absolute inset-0 rounded-full transition-all duration-300",
                    isCompleted ? "w-full" : "w-0",
                  )}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
