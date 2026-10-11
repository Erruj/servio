import React, { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { cn } from "@/lib/utils";

export type StickyItem = { title: string; description: string; content?: React.ReactNode };

export const StickyScroll = ({ content, contentClassName }: { content: StickyItem[]; contentClassName?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const idx = Math.min(content.length - 1, Math.max(0, Math.floor(latest * content.length)));
    setActive(idx);
  });

  return (
    <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div ref={ref} className="relative pl-12">
        {/* progress line */}
        <div className="absolute bottom-0 left-4 top-0 w-px bg-white/10" />
        <motion.div
          style={{ scaleY: scrollYProgress }}
          className="absolute bottom-0 left-4 top-0 w-px origin-top bg-gradient-to-b from-transparent via-blue-500 to-transparent"
        />
        {content.map((item, i) => (
          <div key={item.title} className="relative flex flex-col justify-center py-10 lg:min-h-[45vh]">
            <span
              className={cn(
                "absolute -left-12 top-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-200 lg:top-1/2 lg:-translate-y-1/2",
                active === i
                  ? "border-blue-400 bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                  : "border-white/15 bg-[#0A0F1E] text-slate-400",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={cn("transition-opacity duration-300", active === i ? "lg:opacity-100" : "lg:opacity-30")}>
              <h3 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{item.title}</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">{item.description}</p>
            </div>
            <div className="mt-8 lg:hidden">{item.content}</div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <div className={cn("sticky top-28 h-[28rem] w-full", contentClassName)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              {content[active]?.content ?? null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
