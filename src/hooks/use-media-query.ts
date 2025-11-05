import { useEffect, useState } from 'react'

/**
 * Custom hook to detect media query matches
 * @param query - Media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQuery.matches)

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    mediaQuery.addEventListener('change', listener)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', listener)
    }
  }, [query])

  return matches
}
