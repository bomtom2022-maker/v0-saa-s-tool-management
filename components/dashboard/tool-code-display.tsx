"use client"

import { cn } from "@/lib/utils"

interface ToolCodeDisplayProps {
  code: string
  className?: string
}

/**
 * Displays a tool code with reform suffix "R" highlighted in light blue.
 * If the code ends with "R" (reform indicator), 
 * the R is rendered in sky-400 to visually differentiate reformed tools.
 * Only a single R is ever used as suffix.
 */
export function ToolCodeDisplay({ code, className }: ToolCodeDisplayProps) {
  // Match a single trailing R at the end of the code
  const match = code.match(/^(.+?)(R)$/)

  if (!match) {
    // No trailing R - render normally
    return <span className={cn("font-mono", className)}>{code}</span>
  }

  const baseCode = match[1]
  const reformSuffix = match[2]

  return (
    <span className={cn("font-mono", className)}>
      {baseCode}
      <span className="text-sky-400 font-bold">{reformSuffix}</span>
    </span>
  )
}
