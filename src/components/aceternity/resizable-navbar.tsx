import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { cn } from "@/lib/utils";

const SHADOW =
  "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset";

export const Navbar = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => setVisible(latest > 100));
  return (
    <motion.div ref={ref} className={cn("fixed inset-x-0 top-0 z-50 w-full pt-3", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ visible?: boolean }>, { visible })
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({
  children,
  className,
  visible,
}: {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}) => (
  <div className="mx-auto hidden w-full max-w-7xl px-4 sm:px-6 lg:flex lg:px-8">
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible ? SHADOW : "none",
        y: visible ? 12 : 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 50 }}
      className={cn(
        "relative z-[60] mx-auto flex flex-row items-center justify-between gap-6 rounded-full bg-transparent py-2 transition-[padding] duration-200",
        visible ? "w-auto bg-white/80 px-5" : "w-full px-0",
        className,
      )}
    >
      {children}
    </motion.div>
  </div>
);

export const NavItems = ({
  items,
  className,
  onItemClick,
}: {
  items: { name: string; link: string }[];
  className?: string;
  onItemClick?: () => void;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn("hidden flex-row items-center gap-1 text-sm font-medium lg:flex", className)}
    >
      {items.map((item, idx) => (
        <Link
          key={`link-${idx}`}
          to={item.link}
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="pointer-events-auto relative px-4 py-2 text-neutral-600 hover:text-neutral-900"
        >
          {hovered === idx && (
            <motion.div layoutId="servio-nav-hovered" className="absolute inset-0 h-full w-full rounded-full bg-gray-100" />
          )}
          <span className="relative z-20">{item.name}</span>
        </Link>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({
  children,
  className,
  visible,
}: {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}) => (
  <motion.div
    animate={{
      backdropFilter: visible ? "blur(10px)" : "none",
      boxShadow: visible ? SHADOW : "none",
      width: visible ? "92%" : "100%",
      paddingRight: visible ? "12px" : "0px",
      paddingLeft: visible ? "12px" : "0px",
      borderRadius: visible ? "16px" : "2rem",
      y: visible ? 8 : 0,
    }}
    transition={{ type: "spring", stiffness: 200, damping: 50 }}
    className={cn(
      "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden",
      visible && "bg-white/85",
      className,
    )}
  >
    {children}
  </motion.div>
);

export const MobileNavHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex w-full flex-row items-center justify-between px-2", className)}>{children}</div>
);

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={cn(
          "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-2xl bg-white px-4 py-6",
          className,
        )}
        style={{ boxShadow: SHADOW }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export const MobileNavToggle = ({ isOpen, onClick, openLabel, closeLabel }: { isOpen: boolean; onClick: () => void; openLabel: string; closeLabel: string }) => (
  <button type="button" onClick={onClick} aria-label={isOpen ? closeLabel : openLabel} className="flex h-11 w-11 items-center justify-center text-neutral-900">
    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
  </button>
);
