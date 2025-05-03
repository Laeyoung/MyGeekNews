import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines Tailwind CSS classes with conditional class names.
 * Uses clsx for handling conditional classes and tailwind-merge for resolving conflicts.
 * @param inputs - Class values (strings, arrays, objects).
 * @returns A string of combined and merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// You can add other utility functions here if needed.