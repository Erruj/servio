import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { InboxVisual, AnalyticsVisual, DocumentVisual } from '@/components/landing/FeatureVisuals';

export function AboutCollage() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-30, 30]);
  const y3 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -20]);

  return (
    <section className="overflow-x-clip py-16 md:py-24" aria-hidden="true">
      <div ref={ref} className="relative mx-auto h-[20rem] w-full max-w-5xl px-4 sm:h-[24rem] sm:px-6 md:h-[28rem] lg:px-8">
        <motion.div style={{ y: y1 }} className="absolute left-[4%] top-[8%] w-[62%] -rotate-6 md:w-[48%]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-input"><InboxVisual /></div>
        </motion.div>
        <motion.div style={{ y: y2 }} className="absolute right-[4%] top-0 w-[56%] rotate-3 md:w-[44%]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-input"><AnalyticsVisual /></div>
        </motion.div>
        <motion.div style={{ y: y3 }} className="absolute bottom-0 left-1/2 z-10 w-[58%] -translate-x-1/2 rotate-[-2deg] md:w-[40%]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-input"><DocumentVisual /></div>
        </motion.div>
      </div>
    </section>
  );
}
