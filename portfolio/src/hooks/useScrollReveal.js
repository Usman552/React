import { useEffect, useRef } from "react";

/**
 * useScrollReveal
 * -----------------
 * Har element ke liye ek "ref" deta hai. Jab wo element scroll kar ke
 * viewport me aata hai, IntersectionObserver "is-visible" class add
 * kar deta hai — jis se index.css wali .reveal animation chal jati hai.
 *
 * Isme koi extra npm package (framer-motion waghera) ki zaroorat nahi,
 * pure browser API (IntersectionObserver) use hota hai.
 *
 * Usage:
 *   const ref = useScrollReveal();
 *   <div ref={ref} className="reveal">...</div>
 */
export default function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          // ek dafa reveal hone ke baad observe karna band kar dete hain
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -60px 0px",
        ...options,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}
