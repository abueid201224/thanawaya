import { test, expect } from '@playwright/test';
import { startEmbeddedServer } from '../server/app';
import express from 'express';

// Test timeout configuration
const TEST_TIMEOUT = 30000;

/**
 * Smoke tests for the Thanaweya Math Copilot embedded server and IPC
 * These tests verify basic functionality without requiring actual API keys
 */

test.describe('Embedded Server Smoke Tests', () => {
  let server: any = null;
  let port: number = 0;

  test.beforeAll(async () => {
    // Start embedded server for testing
    const embeddedServer = await startEmbeddedServer({
      preferredPort: 47322,
      host: '127.0.0.1',
      loopbackOnly: true
    });
    
    server = embeddedServer.server;
    port = embeddedServer.port;
    
    // Give server a moment to start
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  test.afterAll(async () => {
    // Clean up server
    if (server && typeof server.close === 'function') {
      await new Promise<void>((resolve, reject) => {
        server.close((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  });

  test('Health endpoint returns OK status', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.server).toContain('Thanaweya Embedded Local Server');
  });

  test('Key status endpoint returns configured status', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/key-status`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('isConfigured');
    expect(typeof data.isConfigured).toBe('boolean');
  });

  test('OCR endpoint returns error without image data', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/ocr-math`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('IMAGE_DATA_REQUIRED');
  });

  test('OCR endpoint returns error without API key', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/ocr-math`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'test' })
    });
    
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.code).toBe('MISSING_API_KEY');
  });

  test('Coding Buddy endpoint returns error without prompt', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/coding-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('PROMPT_REQUIRED');
  });

  test('Coding Buddy endpoint returns error without API key', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/coding-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt: 'test' })
    });
    
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.code).toBe('MISSING_API_KEY');
  });

  test('Model config endpoint returns current model', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/model-config`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('currentModel');
    expect(data.defaultModel).toBe('gemini-flash-latest');
  });
});

/**
 * Node.js script-based smoke tests (can run without Playwright)
 * These are simpler tests that can be run in CI environments
 */

test.describe('Node.js Smoke Tests', () => {
  test('Can import and create server', async () => {
    const { createExpressApp } = await import('../server/app');
    
    const app = createExpressApp({ loopbackOnly: true });
    expect(app).toHaveProperty('app');
    expect(typeof app.setApiKey).toBe('function');
    expect(typeof app.getApiKeyStatus).toBe('function');
  });

  test('Server validates OCR response schema', async () => {
    const { ocrMathResponseSchema } = await import('../server/app');
    
    // Valid response
    const validResponse = {
      plainText: 'Test math problem',
      confidence: 95.5
    };
    
    const result = ocrMathResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    
    // Invalid response (missing required plainText)
    const invalidResponse = {
      latex: 'x^2',
      confidence: 95.5
    };
    
    const invalidResult = ocrMathResponseSchema.safeParse(invalidResponse);
    expect(invalidResult.success).toBe(false);
  });

  test('Server validates Coding Buddy response schema', async () => {
    const { codingBuddyResponseSchema } = await import('../server/app');
    
    // Valid response
    const validResponse = {
      title: 'Test',
      funExplanation: 'Test explanation',
      analogy: 'Test analogy',
      codeSnippet: 'print("hello")',
      codeLanguage: 'python',
      outputSimulation: 'Test output',
      goldenTrick: 'Test trick',
      mathConnection: 'Test connection'
    };
    
    const result = codingBuddyResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    
    // Invalid response (missing required fields)
    const invalidResponse = {
      title: 'Test'
    };
    
    const invalidResult = codingBuddyResponseSchema.safeParse(invalidResponse);
    expect(invalidResult.success).toBe(false);
  });
});
