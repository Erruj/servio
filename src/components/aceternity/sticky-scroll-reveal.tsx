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
    <div ref={ref} className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 lg:grid-cols-2">
      <div>
        {content.map((item, i) => (
          <div key={item.title} className="flex min-h-[55vh] flex-col justify-center py-10">
            <motion.div animate={{ opacity: active === i ? 1 : 0.3 }} transition={{ duration: 0.3 }}>
              <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-blue-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{item.title}</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">{item.description}</p>
            </motion.div>
            <div className="mt-8 lg:hidden">{item.content}</div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <div
          className={cn(
            "sticky top-28 h-[26rem] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur",
            contentClassName,
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
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
