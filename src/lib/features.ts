/**
 * Feature Flags Configuration
 *
 * Toggle features on/off for safe rollback capability
 */

export const FEATURES = {
  /**
   * Automatic PDF-to-PNG conversion for low-confidence PDFs
   *
   * When enabled:
   * - PDFs with <70% confidence are automatically converted to PNG
   * - Conversion happens in browser (client-side)
   * - PNG is uploaded and processed with Vision API
   * - Expected confidence improvement: 30% → 95%
   *
   * When disabled:
   * - Users manually trigger conversion via "Convert to PNG" button
   * - Original manual workflow remains
   *
   * Rollback: Set to false to revert to manual conversion
   */
  AUTO_PDF_CONVERSION: true,

  /**
   * Confidence threshold for triggering automatic conversion
   *
   * Default: 0.70 (70%)
   * - Above this: No conversion needed
   * - Below this: Trigger automatic conversion (if enabled)
   */
  AUTO_CONVERSION_THRESHOLD: 0.70,
} as const

/**
 * Check if automatic PDF conversion is enabled
 */
export function isAutoPdfConversionEnabled(): boolean {
  return FEATURES.AUTO_PDF_CONVERSION
}

/**
 * Get confidence threshold for automatic conversion
 */
export function getAutoConversionThreshold(): number {
  return FEATURES.AUTO_CONVERSION_THRESHOLD
}
