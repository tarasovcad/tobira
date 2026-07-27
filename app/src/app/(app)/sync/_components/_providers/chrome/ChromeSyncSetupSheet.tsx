"use client";

import {useState} from "react";

import {Button} from "@/components/ui/coss/button";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/coss/sheet";
import {useSyncSetupStore} from "@/store/use-sync-setup-store";
import {ChromeAboutStep} from "./ChromeAboutStep";
import {ChromeConnectStep} from "./ChromeConnectStep";
import {ChromePreferencesStep} from "./ChromePreferencesStep";
import {ChromeSetupStepper, type ChromeSetupStep} from "./ChromeSetupStepper";
import {useChromeSetupStore} from "./use-chrome-setup-store";

const BACK_BUTTON_TEXT = ["Cancel", "Back", "Back", "Back"];
const NEXT_BUTTON_TEXT = ["Connect", "Next", "Next", "Finish"];

export function ChromeSyncSetupSheet({userId}: {userId?: string | null}) {
  const isOpen = useSyncSetupStore((state) => state.isOpen && state.provider?.name === "Chrome");
  const setIsOpen = useSyncSetupStore((state) => state.setIsOpen);
  const resetChromeSetup = useChromeSetupStore((state) => state.reset);
  const [currentStep, setCurrentStep] = useState<ChromeSetupStep>(1);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep(1);
      resetChromeSetup();
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      handleOpenChange(false);
      return;
    }

    setCurrentStep((currentStep - 1) as ChromeSetupStep);
  };

  const handleNext = () => {
    if (currentStep === 4) {
      handleOpenChange(false);
      return;
    }

    setCurrentStep((currentStep + 1) as ChromeSetupStep);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetPopup>
        <SheetHeader className="border-border border-b">
          <SheetTitle>Chrome setup</SheetTitle>
          <SheetDescription>Step {currentStep} of 4</SheetDescription>
        </SheetHeader>
        <SheetPanel className="flex flex-col gap-6 p-0">
          <div className="border-border border-b">
            <ChromeSetupStepper currentStep={currentStep} />
          </div>
          {currentStep === 1 ? <ChromeAboutStep /> : null}
          {currentStep === 2 ? <ChromeConnectStep /> : null}
          {currentStep === 3 ? <ChromePreferencesStep userId={userId} /> : null}
        </SheetPanel>
        <SheetFooter>
          <Button type="button" variant="ghost" onClick={handleBack}>
            {BACK_BUTTON_TEXT[currentStep - 1]}
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={currentStep >= 3}
            title={currentStep === 3 ? "Chrome review is not implemented yet" : undefined}>
            {NEXT_BUTTON_TEXT[currentStep - 1]}
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
