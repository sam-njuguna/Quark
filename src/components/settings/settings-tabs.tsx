"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsTabsProps {
  children: React.ReactNode;
  tabs: { value: string; label: string }[];
}

export function SettingsTabs({ children, tabs }: SettingsTabsProps) {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: tabs[0]?.value ?? "profile",
    shallow: true,
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <TabsList>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
