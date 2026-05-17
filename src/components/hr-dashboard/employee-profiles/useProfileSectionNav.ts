import { useEffect, useState } from "react";

export interface ProfileSectionNavItem {
  id: string;
  label: string;
  locked?: boolean;
}

interface UseProfileSectionNavResult {
  activeId: string;
  jumpTo: (id: string) => void;
}

/**
 * Scroll-spy + smooth-scroll for the profile detail page. Observes each
 * section element and reports the one currently in viewport; `jumpTo` smooth-
 * scrolls with a 140px header offset.
 */
export function useProfileSectionNav(
  sections: readonly ProfileSectionNavItem[]
): UseProfileSectionNavResult {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -55% 0px" }
    );
    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const jumpTo = (id: string) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    // `scroll-margin-top` on the section reserves space for the sticky header,
    // and `scrollIntoView` respects whatever scroll container actually owns
    // the page (works whether the window or an inner overflow div scrolls).
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return { activeId, jumpTo };
}
