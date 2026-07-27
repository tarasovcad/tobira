"use client";

import {useState} from "react";

import {Button} from "@/components/ui/coss/button";
import {Form} from "@/components/ui/coss/form";
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
import {XAboutStep} from "./XAboutStep";
import {XConnectStep} from "./XConnectStep";
import XPreferencesStep from "./XPreferencesStep";
import XReviewStep from "./XReviewStep";
import {XSetupStepper, type XSetupStep} from "./XSetupStepper";
import {useXExtensionConnectionStore} from "./use-x-extension-connection-store";

const BACK_BUTTON_TEXT = ["Cancel", "Back", "Back", "Back"];
const NEXT_BUTTON_TEXT = ["Connect", "Next", "Next", "Finish"];

export function XSyncSetupSheet({userId}: {userId?: string | null}) {
  const isOpen = useSyncSetupStore((state) => state.isOpen && state.provider?.name === "X");
  const setIsOpen = useSyncSetupStore((state) => state.setIsOpen);
  const extensionUser = useXExtensionConnectionStore((state) => state.user);
  const [currentStep, setCurrentStep] = useState<XSetupStep>(1);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setCurrentStep(1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      handleOpenChange(false);
      return;
    }

    setCurrentStep((currentStep - 1) as XSetupStep);
  };

  const handleNext = () => {
    if (currentStep === 4) {
      handleOpenChange(false);
      return;
    }

    setCurrentStep((currentStep + 1) as XSetupStep);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetPopup>
        <Form className="contents">
          <SheetHeader className="border-border border-b">
            <SheetTitle>X setup</SheetTitle>
            <SheetDescription>Step {currentStep} of 4</SheetDescription>
          </SheetHeader>
          <SheetPanel className="flex flex-col gap-6 p-0">
            <div className="border-border border-b">
              <XSetupStepper currentStep={currentStep} />
            </div>
            {currentStep === 1 && <XAboutStep />}
            {currentStep === 2 && <XConnectStep />}
            {currentStep === 3 && <XPreferencesStep userId={userId} />}
            {currentStep === 4 && <XReviewStep />}
          </SheetPanel>
          <SheetFooter>
            <Button type="button" variant="ghost" onClick={handleBack}>
              {BACK_BUTTON_TEXT[currentStep - 1]}
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 2 && !extensionUser}>
              {NEXT_BUTTON_TEXT[currentStep - 1]}
            </Button>
          </SheetFooter>
        </Form>
      </SheetPopup>
    </Sheet>
  );
}
