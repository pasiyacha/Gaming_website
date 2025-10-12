/**
 * AI Model Configuration
 * 
 * This file contains configuration settings for AI models used in the application.
 * Claude Sonnet 4 is now enabled for all clients.
 */

const aiConfig = {
  // Default model settings
  defaultModel: 'claude-sonnet-4',
  
  // Claude Sonnet 4 configuration
  claudeSonnet4: {
    enabled: true,       // Enabled for all clients
    maxTokens: 4096,     // Maximum tokens per response
    temperature: 0.7,    // Controls randomness (0.0-1.0)
    topP: 0.9,           // Controls diversity
    apiVersion: '2023-10-12',  // API version
  },
  
  // Feature flags
  features: {
    enableAiAssistant: true,
    enableImageGeneration: true,
    enableContentModeration: true,
  },
  
  // Usage limits (per client)
  usageLimits: {
    requestsPerDay: 500,
    tokensPerMonth: 10000000,
  }
};

module.exports = aiConfig;