import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode, ElementType } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Sectie die rustig in beeld glijdt bij scrollen (eenmalig). */
export function Reveal({
  children,
  className,
  as = 'div',
  delay = 0,
  y = 20,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
  y?: number;
  [key: string]: unknown;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  if (reduced) {
    const Tag = as as ElementType;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/** Container die zijn kinderen na elkaar laat verschijnen zodra hij in beeld komt. */
export function StaggerGroup({
  children,
  className,
  as = 'div',
  stagger = 0.08,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  stagger?: number;
  [key: string]: unknown;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  if (reduced) {
    const Tag = as as ElementType;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
  };

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/** Kind van StaggerGroup. */
export function StaggerItem({
  children,
  className,
  as = 'div',
  y = 18,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  y?: number;
  [key: string]: unknown;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  if (reduced) {
    const Tag = as as ElementType;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  const variants: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  };

  return (
    <MotionTag className={className} variants={variants} {...rest}>
      {children}
    </MotionTag>
  );
}

/** Entrance bij eerste page-load (geen scroll-trigger). */
export function LoadIn({
  children,
  className,
  as = 'div',
  index = 0,
  step = 0.1,
  y = 16,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  index?: number;
  step?: number;
  y?: number;
  [key: string]: unknown;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  if (reduced) {
    const Tag = as as ElementType;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE, delay: index * step }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
