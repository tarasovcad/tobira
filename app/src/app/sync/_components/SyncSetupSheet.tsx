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
import {useSyncSetupStore} from "@/store/use-sync-setup-store";
import {Alert, AlertDescription} from "@/components/coss-ui/alert";
import {SetupStepper, type SetupStep} from "./SetupStepper";
import {ConnectSyncStep} from "./ConnectSyncStep";

export default function SyncSetupSheet() {
  const {isOpen, setIsOpen, provider} = useSyncSetupStore();
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
          <SheetHeader>
            <SheetTitle>{provider?.name} setup</SheetTitle>
            <SheetDescription>Step {currentStep} of 4</SheetDescription>
          </SheetHeader>
          <SheetPanel className="flex flex-col gap-6 p-0">
            <div className="border-border border-y">
              <SetupStepper currentStep={currentStep} />
            </div>
            {currentStep === 1 && <AboutSyncStep />}
            {currentStep === 2 && <ConnectSyncStep />}
          </SheetPanel>
          <SheetFooter>
            <Button variant="ghost" onClick={handleCancelButton}>
              {cancelButtonText[currentStep - 1]}
            </Button>
            <Button onClick={handleSubmitButton}>{handleSubmitButtonText[currentStep - 1]}</Button>
          </SheetFooter>
        </Form>
      </SheetPopup>
    </Sheet>
  );
}

const AboutSyncStep = () => {
  const importedItems = ["Bookmarks", "Posts with media", "Outbound links"];
  const permissionItems = [
    "Read saved bookmarks",
    "Read media attachments on bookmarked posts",
    "Read linked URLS on metadata",
    "No write or post access",
  ];
  return (
    <>
      <p className="text-secondary px-6 text-sm leading-relaxed">
        Connect your X account to pull in every post you have bookmarked, along with embedded media
        and external links. Tobira keeps a clean, searchable copy - even if the original is deleted.
      </p>
      <div className="border-border border-t" />
      <div className="px-6">
        <p className="text-foreground text-[15px] font-[550]">What gets imported</p>
        <ul className="text-secondary mt-2.5 space-y-1.5 text-sm">
          {importedItems.map((item) => (
            <li className="flex items-center gap-1.5" key={item}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 1.5C13.1421 1.5 16.5 4.85786 16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5ZM11.669 6.12818C11.3254 5.89695 10.8596 5.98766 10.6282 6.33106L7.85453 10.4502L6.53027 9.126C6.23738 8.83305 5.76262 8.83305 5.46973 9.126C5.17683 9.41888 5.17683 9.89362 5.46973 10.1865L7.43848 12.1553C7.59697 12.3137 7.81822 12.3929 8.04127 12.3713C8.2641 12.3497 8.46547 12.2296 8.59057 12.0439L11.8718 7.16894C12.103 6.82541 12.0124 6.35953 11.669 6.12818Z"
                  fill="var(--highlight)"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="px-6">
        <p className="text-foreground text-[15px] font-[550]">Permission required</p>
        <ul className="text-secondary mt-2.5 space-y-1.5 text-sm">
          {permissionItems.map((item) => (
            <li className="flex items-center gap-1.5" key={item}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 16.5001C12.728 16.5001 15.75 13.4781 15.75 9.75015V5.97168C15.75 4.77978 15.0444 3.70093 13.9525 3.22321L10.2025 1.58258C9.4359 1.24721 8.5641 1.24721 7.79752 1.58258L4.04754 3.22321C2.95558 3.70093 2.25 4.77979 2.25 5.97168V9.75015C2.25 13.4781 5.27208 16.5001 9 16.5001ZM11.7803 8.03047C12.0732 7.7376 12.0732 7.26271 11.7803 6.96982C11.4874 6.67693 11.0126 6.67693 10.7197 6.96982L8.25 9.4395L7.28033 8.46982C6.98744 8.17695 6.51256 8.17695 6.21967 8.46982C5.92678 8.7627 5.92678 9.2376 6.21967 9.53047L7.71968 11.0305C8.01255 11.3233 8.48745 11.3233 8.78032 11.0305L11.7803 8.03047Z"
                  fill="var(--color-muted-foreground)"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="px-6">
        <Alert className="">
          <AlertDescription>
            Tobira does not store your credentials. We use read-only API access and you can
            disconnect at any time.
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
};
