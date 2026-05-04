import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_THRESHOLD = 80;

export function useAutoScroll(dependency: unknown) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const isUserScrolledUpRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const resumeAutoScroll = useCallback(() => {
    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el) return;
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      const scrolledUp = distanceFromBottom > SCROLL_THRESHOLD;
      isUserScrolledUpRef.current = scrolledUp;
      setIsUserScrolledUp(scrolledUp);
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      scrollToBottom("smooth");
    }
  }, [dependency, scrollToBottom]);

  return { containerRef, isUserScrolledUp, resumeAutoScroll, scrollToBottom };
}
