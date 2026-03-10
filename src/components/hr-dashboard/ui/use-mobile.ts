import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        : null;

    if (mediaQuery) {
      mediaQuery.addEventListener("change", update);
    } else {
      window.addEventListener("resize", update);
    }

    update();

    return () => {
      if (mediaQuery) {
        mediaQuery.removeEventListener("change", update);
      } else {
        window.removeEventListener("resize", update);
      }
    };
  }, []);

  return !!isMobile;
}
