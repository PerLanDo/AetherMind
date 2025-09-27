#!/usr/bin/env node

/**
 * Quick Grok API Test - Simple test to verify API key works
 * Usage: node quick-grok-test.js
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GROK_4_FAST_FREE_API_KEY;

if (!API_KEY) {
  console.log('❌ No API key found in .env file');
  process.exit(1);
}

console.log('🧪 Quick Grok Test...');
console.log(`🔑 Key: ${API_KEY.substring(0, 12)}...`);

try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'AetherMind'
    },
    body: JSON.stringify({
      model: 'x-ai/grok-beta',
      messages: [{ role: 'user', content: 'Say "API works!"' }],
      max_tokens: 10
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ SUCCESS! API is working');
    console.log(`🤖 Response: ${data.choices[0].message.content}`);
  } else {
    console.log(`❌ FAILED: ${response.status} ${response.statusText}`);
    const error = await response.text();
    console.log(`Error: ${error}`);
  }
} catch (err) {
  console.log(`❌ ERROR: ${err.message}`);
}
