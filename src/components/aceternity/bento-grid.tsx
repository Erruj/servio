import React from "react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[20rem] md:grid-cols-3", className)}>
    {children}
  </div>
);

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  children,
}: {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      "group/bento relative row-span-1 flex flex-col justify-between space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-input transition duration-200 hover:shadow-xl",
      className,
    )}
  >
    {children}
    {header}
    <div className="relative z-10 transition duration-200 group-hover/bento:translate-x-2">
      {icon}
      <div className="mb-2 mt-2 font-semibold tracking-tight text-neutral-900">{title}</div>
      <div className="text-sm font-normal text-neutral-600">{description}</div>
    </div>
  </div>
);
