"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "My Work",
  "/dashboard/all": "All Work",
  "/dashboard/new": "New Work",
  "/dashboard/team": "Team",
  "/dashboard/settings": "Settings",
};

function getLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (
    pathname.startsWith("/dashboard/work/") ||
    pathname.startsWith("/dashboard/w/")
  )
    return "Work Detail";
  return "Overview";
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  const label = getLabel(pathname);
  const isRoot = pathname === "/dashboard";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isRoot ? (
            <BreadcrumbPage>My Work</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {!isRoot && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
