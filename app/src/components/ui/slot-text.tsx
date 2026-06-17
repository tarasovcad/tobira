import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
} from "react";
import {
  animateSlotText,
  buildSlotText,
  clearSlotText,
  type SlotOptions,
} from "@/components/ui/slot-text-core";

export type {SlotOptions as SlotTextProps};

export interface SlotTextComponentProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  text: string;
  options?: SlotOptions;
  onReady?: () => void;
}

export const SlotText = forwardRef<HTMLSpanElement, SlotTextComponentProps>(
  ({text, options, onReady, "aria-label": ariaLabel, ...props}, forwardedRef) => {
    const elementRef = useRef<HTMLSpanElement>(null);
    const mountedRef = useRef(false);
    const firstTextEffectRef = useRef(true);
    const optionsRef = useRef<SlotOptions | undefined>(options);
    const onReadyRef = useRef(onReady);

    useImperativeHandle(forwardedRef, () => elementRef.current!, []);

    useEffect(() => {
      optionsRef.current = options;
    }, [options]);

    useEffect(() => {
      onReadyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      buildSlotText(element, text);
      mountedRef.current = true;
      onReadyRef.current?.();

      return () => {
        clearSlotText(element);
        mountedRef.current = false;
        firstTextEffectRef.current = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const element = elementRef.current;
      if (!element || !mountedRef.current) return;
      if (firstTextEffectRef.current) {
        firstTextEffectRef.current = false;
        return;
      }

      animateSlotText(element, text, optionsRef.current);
    }, [text]);

    return createElement("span", {
      ...props,
      "aria-label": ariaLabel ?? text,
      ref: elementRef,
    });
  },
);

SlotText.displayName = "SlotText";
