"use client";

import {useState} from "react";

import {Button} from "@/components/coss-ui/button";
import {Form} from "@/components/coss-ui/form";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/coss-ui/sheet";
import {useExtensionConnectionStore} from "@/store/use-extension-connection-store";
import {useSyncSetupStore} from "@/store/use-sync-setup-store";
import {SetupStepper, type SetupStep} from "./SetupStepper";
import {ConnectSyncStep} from "./ConnectSyncStep";
import PreferencesSyncStep from "./PreferencesSyncStep";
import AboutSyncStep from "./AboutSyncStep";
import ReviewSyncStep from "./ReviewSyncStep";

export default function SyncSetupSheet({userId}: {userId?: string | null}) {
  const {isOpen, setIsOpen, provider} = useSyncSetupStore();
  const extensionUser = useExtensionConnectionStore((state) => state.user);
  const [currentStep, setCurrentStep] = useState<SetupStep>(1);

  const cancelButtonText = ["Cancel", "Back", "Back", "Back"];
  const handleSubmitButtonText = ["Connect", "Next", "Next", "Finish"];

  const handleCancelButton = () => {
    if (currentStep === 1) {
      setIsOpen(false);
    } else {
      setCurrentStep((currentStep - 1) as SetupStep);
    }
  };

  const handleSubmitButton = () => {
    if (currentStep === 4) {
      setIsOpen(false);
    } else {
      setCurrentStep((currentStep + 1) as SetupStep);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetPopup>
        <Form className="contents">
          <SheetHeader className="border-border border-b">
            <SheetTitle>{provider?.name} setup</SheetTitle>
            <SheetDescription>Step {currentStep} of 4</SheetDescription>
          </SheetHeader>
          <SheetPanel className="flex flex-col gap-6 p-0">
            <div className="border-border border-b">
              <SetupStepper currentStep={currentStep} />
            </div>
            {currentStep === 1 && <AboutSyncStep />}
            {currentStep === 2 && <ConnectSyncStep />}
            {currentStep === 3 && <PreferencesSyncStep userId={userId} />}
            {currentStep === 4 && <ReviewSyncStep />}
          </SheetPanel>
          <SheetFooter>
            <Button variant="ghost" onClick={handleCancelButton}>
              {cancelButtonText[currentStep - 1]}
            </Button>
            <Button onClick={handleSubmitButton} disabled={currentStep === 2 && !extensionUser}>
              {handleSubmitButtonText[currentStep - 1]}
            </Button>
          </SheetFooter>
        </Form>
      </SheetPopup>
    </Sheet>
  );
}
