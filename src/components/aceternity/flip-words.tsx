import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  duration = 2600,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const reduce = useReducedMotion();

  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (isAnimating || reduce) return;
    const id = window.setTimeout(startAnimation, duration);
    return () => window.clearTimeout(id);
  }, [isAnimating, duration, startAnimation, reduce]);

  // reset when language (words) changes
  useEffect(() => {
    setCurrentWord(words[0]);
  }, [words]);

  // Meet de breedte van elk woord; de regel animeert naar de breedte van
  // het actieve woord, zodat de hele kop gecentreerd blijft.
  const measureRef = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      const next: Record<string, number> = {};
      Array.from(el.children).forEach((c, i) => { next[words[i]] = (c as HTMLElement).offsetWidth; });
      setWidths(next);
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [words]);
  const sizer = (
    <span ref={measureRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 flex">
      {words.map((w) => <span key={w} className="whitespace-nowrap px-2">{w}</span>)}
    </span>
  );
  const width = widths[currentWord];

  if (reduce) {
    return (
      <span className={cn("relative inline-block whitespace-nowrap px-2 text-primary", className)}>{words[0]}</span>
    );
  }

  return (
    <motion.span
      className="relative inline-grid justify-items-start align-bottom"
      initial={false}
      animate={width ? { width } : undefined}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
    {sizer}
    <AnimatePresence onExitComplete={() => setIsAnimating(false)}>
      <motion.span
        key={currentWord}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        exit={{ opacity: 0, y: -40, x: 40, scale: 2, position: "absolute" }}
        className={cn("relative z-10 inline-block whitespace-nowrap px-2 text-left text-primary [grid-area:1/1]", className)}
      >
        {currentWord.split(" ").map((word, wordIndex) => (
          <motion.span
            key={word + wordIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: wordIndex * 0.3, duration: 0.3 }}
            className="inline-block whitespace-nowrap"
          >
            {word.split("").map((letter, letterIndex) => (
              <motion.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: wordIndex * 0.3 + letterIndex * 0.05, duration: 0.2 }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            {wordIndex < currentWord.split(" ").length - 1 && <span className="inline-block">&nbsp;</span>}
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
    </motion.span>
  );
};
