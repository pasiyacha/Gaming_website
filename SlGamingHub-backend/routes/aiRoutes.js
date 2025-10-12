const express = require('express');
const router = express.Router();
const aiConfig = require('../config/aiConfig');

// AI service utility
const callAiModel = async (prompt, options = {}) => {
  // This is a placeholder function that would be replaced with actual API calls
  // to Claude Sonnet 4 in a real implementation
  try {
    console.log(`Calling AI model: ${aiConfig.defaultModel}`);
    console.log(`Prompt: ${prompt}`);
    
    // In a real implementation, this would make an API call to Anthropic's Claude API
    // For demonstration purposes, we're just returning a mock response
    return {
      model: aiConfig.defaultModel,
      completion: "This is a response from Claude Sonnet 4.",
      usage: {
        prompt_tokens: prompt.length / 4,
        completion_tokens: 10,
        total_tokens: prompt.length / 4 + 10
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calling AI model:', error);
    throw new Error('Failed to get AI response');
  }
};

// Get AI configuration
router.get('/config', (req, res) => {
  // Remove sensitive information before sending to client
  const clientConfig = {
    defaultModel: aiConfig.defaultModel,
    features: aiConfig.features,
    modelSettings: {
      temperature: aiConfig.claudeSonnet4.temperature,
      maxTokens: aiConfig.claudeSonnet4.maxTokens
    }
  };
  
  res.json(clientConfig);
});

// Generate AI response
router.post('/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }
    
    const response = await callAiModel(prompt, options);
    
    res.json({
      message: "AI response generated successfully",
      response
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ message: "Server error generating AI response" });
  }
});

// Update AI configuration (admin only)
router.put('/config', (req, res) => {
  try {
    const { temperature, maxTokens, features } = req.body;
    
    // Update configuration
    if (temperature !== undefined) aiConfig.claudeSonnet4.temperature = temperature;
    if (maxTokens !== undefined) aiConfig.claudeSonnet4.maxTokens = maxTokens;
    if (features !== undefined) aiConfig.features = { ...aiConfig.features, ...features };
    
    res.json({
      message: "AI configuration updated successfully",
      config: {
        defaultModel: aiConfig.defaultModel,
        features: aiConfig.features,
        modelSettings: {
          temperature: aiConfig.claudeSonnet4.temperature,
          maxTokens: aiConfig.claudeSonnet4.maxTokens
        }
      }
    });
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    res.status(500).json({ message: "Server error updating AI configuration" });
  }
});

module.exports = router;