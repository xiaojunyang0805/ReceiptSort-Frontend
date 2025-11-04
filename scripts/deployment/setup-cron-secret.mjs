#!/usr/bin/env node

/**
 * Generate and add CRON_SECRET to environment variables
 * This secret is used to secure the cron job endpoints
 */

import { randomBytes } from 'crypto'
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')

// Generate a secure random secret
const cronSecret = randomBytes(32).toString('hex')

console.log('🔐 Generating CRON_SECRET...')
console.log('')

// Check if .env.local exists
if (!existsSync(envPath)) {
  console.error('❌ .env.local file not found!')
  console.log('Please create .env.local file first')
  process.exit(1)
}

// Read current content
const envContent = readFileSync(envPath, 'utf-8')

// Check if CRON_SECRET already exists
if (envContent.includes('CRON_SECRET=')) {
  console.log('⚠️  CRON_SECRET already exists in .env.local')
  console.log('Skipping to avoid overwriting existing secret')
  console.log('')
  console.log('If you want to regenerate it, manually remove the CRON_SECRET line first')
  process.exit(0)
}

// Add CRON_SECRET to .env.local
const newLine = envContent.endsWith('\n') ? '' : '\n'
appendFileSync(envPath, `${newLine}\n# Cron Job Secret (for Vercel Cron Jobs)\nCRON_SECRET=${cronSecret}\n`)

console.log('✅ CRON_SECRET added to .env.local')
console.log('')
console.log('📋 Next steps:')
console.log('1. Add this secret to Vercel environment variables:')
console.log('   vercel env add CRON_SECRET')
console.log('   Then paste this value when prompted:')
console.log(`   ${cronSecret}`)
console.log('')
console.log('2. Select: Production, Preview, Development (all three)')
console.log('3. Deploy to Vercel')
console.log('')
console.log('The cron job will run daily at 2:00 AM UTC')
