"use client";

import {cn} from "@/lib/utils/classnames";
import {AnimatePresence, motion} from "motion/react";
import {Fragment} from "react";

export type SetupStep = 1 | 2 | 3 | 4;

const STEPS: {
  id: SetupStep;
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
        <g clipPath="url(#clip0_485_19)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.35834 0.600882C3.67088 0.522748 3.98759 0.712777 4.06573 1.02532L4.35739 2.19199C4.43553 2.50454 4.2455 2.82125 3.93296 2.89938C3.62041 2.97752 3.3037 2.7875 3.22556 2.47495L2.9339 1.30828C2.85576 0.995735 3.04579 0.67902 3.35834 0.600882ZM10.8116 3.18833C9.67177 2.04851 7.82377 2.04851 6.68394 3.18833L6.68126 3.19105L6.24288 3.62365C6.01363 3.84996 5.64427 3.84752 5.41796 3.61823C5.19166 3.38892 5.19409 3.01959 5.42339 2.79329L5.86045 2.36194C7.45598 0.767943 10.0416 0.768421 11.6366 2.36337C13.2316 3.95835 13.232 6.544 11.638 8.1396L11.6366 8.14094L11.2066 8.57657C10.9804 8.80588 10.611 8.80827 10.3817 8.582C10.1524 8.35566 10.15 7.98635 10.3763 7.75705L10.8116 7.31599C11.9514 6.17615 11.9514 4.32815 10.8116 3.18833ZM0.600563 3.35865C0.6787 3.04611 0.99541 2.85608 1.30796 2.93422L2.47463 3.22588C2.78717 3.30402 2.9772 3.62073 2.89906 3.93328C2.82093 4.24583 2.50421 4.43586 2.19167 4.35772L1.025 4.06605C0.712452 3.98791 0.522426 3.6712 0.600563 3.35865ZM3.6179 5.41829C3.8472 5.64459 3.84963 6.01393 3.62333 6.24324L3.18802 6.6843C2.0482 7.82413 2.04819 9.67213 3.18801 10.812C4.32783 11.9517 6.17586 11.9517 7.31563 10.812L7.31837 10.8092L7.75675 10.3766C7.986 10.1503 8.35537 10.1527 8.58164 10.382C8.80798 10.6114 8.80553 10.9807 8.57622 11.207L8.14064 11.6369L8.13918 11.6383C6.54365 13.2323 3.95801 13.2319 2.36305 11.6369C0.76809 10.0419 0.767624 7.45628 2.36165 5.86075L2.79296 5.42371C3.01927 5.19441 3.3886 5.19198 3.6179 5.41829ZM11.1006 10.067C11.1787 9.75444 11.4954 9.56439 11.8079 9.64255L12.9746 9.93422C13.2872 10.0123 13.4772 10.3291 13.399 10.6416C13.3209 10.9542 13.0042 11.1442 12.6917 11.0661L11.525 10.7744C11.2125 10.6962 11.0224 10.3795 11.1006 10.067ZM10.0667 11.1009C10.3792 11.0227 10.6959 11.2128 10.774 11.5253L11.0657 12.692C11.1439 13.0045 10.9538 13.3212 10.6413 13.3994C10.3287 13.4775 10.012 13.2875 9.93392 12.975L9.64226 11.8083C9.56409 11.4957 9.75414 11.179 10.0667 11.1009Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_485_19">
            <rect width="14" height="14" fill="white" />
          </clipPath>
        </defs>
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

interface SetupStepperProps {
  currentStep: SetupStep;
}

export function SetupStepper({currentStep}: SetupStepperProps) {
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
                  "flex size-6.5 items-center justify-center rounded-full ring-offset-2 transition-all duration-200",
                  isCompleted && "bg-foreground text-primary-foreground ring-primary/20 ring-2",
                  isActive && "bg-foreground text-primary-foreground ring-primary/25 ring-[1px]",
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
