#!/usr/bin/env node

/**
 * Inspect the downloaded file to understand corruption
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the downloaded file from user's Downloads folder
// User should copy it to this location
const DOWNLOADED_FILE = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'receipts_export_2025-10-21.xlsx')

function inspectFile() {
  console.log('=== File Inspection ===\n')

  if (!fs.existsSync(DOWNLOADED_FILE)) {
    console.error('❌ File not found:', DOWNLOADED_FILE)
    console.log('\nPlease copy the downloaded file to:')
    console.log(DOWNLOADED_FILE)
    return
  }

  const stats = fs.statSync(DOWNLOADED_FILE)
  console.log('File size:', stats.size, 'bytes')

  const buffer = fs.readFileSync(DOWNLOADED_FILE)

  console.log('\nFirst 100 bytes (hex):')
  console.log(buffer.slice(0, 100).toString('hex'))

  console.log('\nFirst 100 bytes (string):')
  console.log(buffer.slice(0, 100).toString('utf8'))

  console.log('\nLast 100 bytes (hex):')
  console.log(buffer.slice(-100).toString('hex'))

  // Check for Excel file signature
  const excelSignature = buffer.slice(0, 4).toString('hex')
  console.log('\nFile signature (first 4 bytes):', excelSignature)

  // Valid Excel 2007+ file should start with PK (zip format)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    console.log('✓ File has valid ZIP/Excel signature (PK)')
  } else {
    console.log('❌ Invalid Excel signature! Expected: 504b (PK), Got:', excelSignature)
  }

  // Check for common corruption patterns
  if (buffer.toString('utf8').includes('<!DOCTYPE html>')) {
    console.log('❌ File contains HTML! This is likely an error page, not an Excel file')
  }

  if (buffer.toString('utf8').includes('{"error"')) {
    console.log('❌ File contains JSON error response')
  }
}

inspectFile()
