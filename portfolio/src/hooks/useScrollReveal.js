import { useEffect, useRef } from "react";

/**
 * Adds `is-visible` to the element the first time it scrolls into view.
 * Options are primitives so the observer is created once per element.
 */
export default function useScrollReveal(threshold = 0.15, rootMargin = "0px 0px -60px 0px") {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
