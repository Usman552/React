import { useEffect, useState } from "react";

const PAUSE_BETWEEN_WORDS = 240;

/**
 * Types out each word, holds it, erases it, then moves to the next one.
 * Every transition happens inside the timer callback so the effect body
 * never sets state synchronously.
 */
export default function useTypewriter(words, { type = 85, erase = 40, hold = 1600 } = {}) {
  const [state, setState] = useState({ index: 0, text: "", erasing: false });

  useEffect(() => {
    const word = words[state.index % words.length];
    const wordComplete = !state.erasing && state.text === word;
    const wordCleared = state.erasing && state.text === "";

    const delay = wordComplete
      ? hold
      : wordCleared
        ? PAUSE_BETWEEN_WORDS
        : state.erasing
          ? erase
          : type;

    const timer = setTimeout(() => {
      setState((prev) => {
        const current = words[prev.index % words.length];

        if (!prev.erasing && prev.text === current) {
          return { ...prev, erasing: true };
        }

        if (prev.erasing && prev.text === "") {
          return { index: (prev.index + 1) % words.length, text: "", erasing: false };
        }

        return {
          ...prev,
          text: prev.erasing
            ? current.slice(0, prev.text.length - 1)
            : current.slice(0, prev.text.length + 1),
        };
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [state, words, type, erase, hold]);

  return state.text;
}
