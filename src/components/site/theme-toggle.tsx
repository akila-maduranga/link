"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  // Static label + CSS-driven icon swap — fully hydration-safe.
  // The active theme is read from the DOM class at click time.
  function toggle() {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggle}
      className="text-muted-foreground hover:text-foreground"
    >
      <Sun className="hidden h-4.5 w-4.5 dark:block" />
      <Moon className="h-4.5 w-4.5 dark:hidden" />
    </Button>
  )
}
