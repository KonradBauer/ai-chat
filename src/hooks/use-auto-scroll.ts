import { useEffect, useRef, useState } from "react";

const SCROLL_THRESHOLD = 80;

export function useAutoScroll(dependency: unknown, isStreaming: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const isUserScrolledUpRef = useRef(false);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  function resumeAutoScroll() {
    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
    scrollToBottom("smooth");
  }

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
      // instant during stream to avoid animation pile-up; smooth for discrete jumps
      scrollToBottom(isStreaming ? "instant" : "smooth");
    }
  }, [dependency, isStreaming]);

  return { containerRef, isUserScrolledUp, resumeAutoScroll };
}
