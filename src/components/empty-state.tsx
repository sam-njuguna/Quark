"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  animated?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  animated = true,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 10 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      <motion.div
        initial={animated ? { scale: 0.9 } : undefined}
        animate={animated ? { scale: 1 } : undefined}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="rounded-full bg-muted p-4 mb-4"
      >
        <Icon className="size-8 text-muted-foreground" />
      </motion.div>
      <motion.h3
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="text-lg font-medium text-foreground mb-1"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-sm text-muted-foreground max-w-sm mb-4"
      >
        {description}
      </motion.p>
      {action && (
        <motion.div
          initial={animated ? { opacity: 0 } : undefined}
          animate={animated ? { opacity: 1 } : undefined}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
