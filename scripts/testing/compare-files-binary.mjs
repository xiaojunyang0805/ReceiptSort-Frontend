#!/usr/bin/env node

/**
 * Binary comparison of local vs downloaded file
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCAL_FILE = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'LOCAL_EXPORT_COMPARISON.xlsx')
const DOWNLOADED_FILE = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'receipts_export_2025-10-21.xlsx')

async function compareFiles() {
  console.log('=== Binary File Comparison ===\n')

  if (!fs.existsSync(LOCAL_FILE)) {
    console.error('❌ Local file not found:', LOCAL_FILE)
    return
  }

  if (!fs.existsSync(DOWNLOADED_FILE)) {
    console.error('❌ Downloaded file not found:', DOWNLOADED_FILE)
    return
  }

  const localBuffer = fs.readFileSync(LOCAL_FILE)
  const downloadedBuffer = fs.readFileSync(DOWNLOADED_FILE)

  console.log('Local file size:', localBuffer.length, 'bytes')
  console.log('Downloaded file size:', downloadedBuffer.length, 'bytes')
  console.log('Size difference:', downloadedBuffer.length - localBuffer.length, 'bytes')
  console.log()

  // Compare first 200 bytes
  console.log('=== First 200 bytes comparison ===')
  console.log('Local (hex):')
  console.log(localBuffer.slice(0, 200).toString('hex'))
  console.log('\nDownloaded (hex):')
  console.log(downloadedBuffer.slice(0, 200).toString('hex'))
  console.log()

  // Find first difference
  let firstDiff = -1
  const minLen = Math.min(localBuffer.length, downloadedBuffer.length)

  for (let i = 0; i < minLen; i++) {
    if (localBuffer[i] !== downloadedBuffer[i]) {
      firstDiff = i
      break
    }
  }

  if (firstDiff === -1 && localBuffer.length === downloadedBuffer.length) {
    console.log('✓ Files are IDENTICAL!')
  } else if (firstDiff === -1) {
    console.log(`Files are identical up to byte ${minLen}, but different lengths`)
  } else {
    console.log(`❌ First difference at byte ${firstDiff}`)
    console.log('Local byte:', localBuffer[firstDiff].toString(16).padStart(2, '0'))
    console.log('Downloaded byte:', downloadedBuffer[firstDiff].toString(16).padStart(2, '0'))
    console.log('\nContext (20 bytes around first difference):')
    const start = Math.max(0, firstDiff - 10)
    const end = Math.min(minLen, firstDiff + 10)
    console.log('Local:', localBuffer.slice(start, end).toString('hex'))
    console.log('Downloaded:', downloadedBuffer.slice(start, end).toString('hex'))
  }

  // Compare last 200 bytes
  console.log('\n=== Last 200 bytes comparison ===')
  console.log('Local (hex):')
  console.log(localBuffer.slice(-200).toString('hex'))
  console.log('\nDownloaded (hex):')
  console.log(downloadedBuffer.slice(-200).toString('hex'))

  // Try to open both with ExcelJS
  await testExcelJS()

  async function testExcelJS() {
    console.log('\n=== Trying to load both files with ExcelJS ===')

    const ExcelJS = (await import('exceljs')).default

    try {
      const localWorkbook = new ExcelJS.Workbook()
      await localWorkbook.xlsx.load(localBuffer)
      console.log('✓ Local file loads successfully in ExcelJS')
      console.log('  Worksheets:', localWorkbook.worksheets.map(w => w.name))
    } catch (error) {
      console.log('❌ Local file failed to load:', error.message)
    }

    try {
      const downloadedWorkbook = new ExcelJS.Workbook()
      await downloadedWorkbook.xlsx.load(downloadedBuffer)
      console.log('✓ Downloaded file loads successfully in ExcelJS')
      console.log('  Worksheets:', downloadedWorkbook.worksheets.map(w => w.name))
    } catch (error) {
      console.log('❌ Downloaded file failed to load:', error.message)
    }
  }
}

compareFiles().catch(console.error)
