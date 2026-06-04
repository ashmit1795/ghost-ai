import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  const computed = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "") // remove non-alphanumeric except spaces/hyphens/underscores
    .replace(/[\s_]+/g, "-")      // replace spaces/underscores with hyphens
    .replace(/-+/g, "-")          // remove duplicate hyphens
    .replace(/^-+|-+$/g, "")      // trim hyphens from start/end
  
  return computed || "workspace"
}
