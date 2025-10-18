#!/usr/bin/env node

/**
 * Update Stripe environment variables on Vercel
 * This script properly sets environment variables without newlines
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';

const execAsync = promisify(exec);

// Read .env.local file
const envContent = readFileSync('.env.local', 'utf-8');

// Parse environment variables
const parseEnv = (content) => {
  const vars = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes and trim
      vars[key] = value.replace(/^["']|["']$/g, '').trim();
    }
  });
  return vars;
};

const env = parseEnv(envContent);

console.log('🔧 Updating Stripe Environment Variables on Vercel');
console.log('==================================================\n');

const updateEnvVar = async (key, value) => {
  console.log(`📝 Updating ${key}...`);
  try {
    // Remove existing variable (answer 'y' automatically)
    await execAsync(`echo y | vercel env rm ${key} production`, { shell: true });
    console.log(`   ✅ Removed old ${key}`);
  } catch (error) {
    // Variable might not exist, that's okay
    console.log(`   ℹ️  No existing ${key} to remove`);
  }

  try {
    // Add new variable
    await execAsync(`echo "${value}" | vercel env add ${key} production`, { shell: true });
    console.log(`   ✅ Added new ${key}\n`);
  } catch (error) {
    console.error(`   ❌ Failed to add ${key}:`, error.message);
  }
};

const main = async () => {
  const varsToUpdate = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_BASIC',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_BUSINESS',
  ];

  for (const key of varsToUpdate) {
    if (env[key]) {
      await updateEnvVar(key, env[key]);
    } else {
      console.log(`⚠️  ${key} not found in .env.local\n`);
    }
  }

  console.log('==================================================');
  console.log('✅ Environment variables updated!');
  console.log('\n📦 Triggering deployment...');

  try {
    await execAsync('git commit --allow-empty -m "Trigger redeploy with clean env vars" && git push');
    console.log('✅ Deployment triggered!');
  } catch (error) {
    console.error('❌ Failed to trigger deployment:', error.message);
  }

  console.log('\n==================================================');
  console.log('⏳ Wait 1-2 minutes for deployment to complete');
  console.log('🌐 Then test at: https://receiptsort.vercel.app/credits');
  console.log('==================================================');
};

main().catch(console.error);
