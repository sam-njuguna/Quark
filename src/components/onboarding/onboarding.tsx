"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BotIcon,
  SparklesIcon,
  ZapIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Quark",
    description: "The AI-native work management platform where humans and AI agents collaborate seamlessly.",
    icon: SparklesIcon,
  },
  {
    id: "ai-agents",
    title: "Work with AI Agents",
    description: "Connect AI agents via MCP to automate workflows. Agents can create, update, and complete work autonomously.",
    icon: BotIcon,
  },
  {
    id: "features",
    title: "Powerful Features",
    description: "Time tracking, Gantt charts, custom fields, automations, and AI-powered suggestions.",
    icon: ZapIcon,
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md mx-4"
      >
        <div className="bg-card border rounded-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <Progress value={progress} className="mb-6" />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-primary/10 p-4">
                    <step.icon className="size-8 text-primary" />
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold text-center mb-2">
                  {step.title}
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-6 py-4 bg-muted/50 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeftIcon className="size-4 mr-1" />
              Back
            </Button>
            
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`size-2 rounded-full transition-colors ${
                    i === currentStep ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            
            <Button size="sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <CheckIcon className="size-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRightIcon className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
