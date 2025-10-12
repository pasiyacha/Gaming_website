/**
 * AI Service for SL Gaming Hub
 * 
 * This service provides methods to interact with the Claude Sonnet 4 AI model
 * that has been enabled for all clients.
 */

import { createApiClient, getApiUrl } from '../utils/apiUtils';

const apiClient = createApiClient();

class AiService {
  /**
   * Get the current AI configuration
   * @returns {Promise<Object>} AI configuration
   */
  static async getConfig() {
    try {
      const response = await apiClient.get(getApiUrl('/ai/config'));
      return response.data;
    } catch (error) {
      console.error('Error fetching AI config:', error);
      throw new Error('Could not load AI configuration');
    }
  }

  /**
   * Generate a response from Claude Sonnet 4
   * @param {string} prompt - The user prompt
   * @param {Object} options - Additional options for the generation
   * @returns {Promise<Object>} AI response
   */
  static async generateResponse(prompt, options = {}) {
    try {
      const response = await apiClient.post(getApiUrl('/ai/generate'), {
        prompt,
        options
      });
      return response.data.response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Could not generate AI response');
    }
  }
  
  /**
   * Update AI configuration (admin only)
   * @param {Object} config - New configuration options
   * @returns {Promise<Object>} Updated configuration
   */
  static async updateConfig(config) {
    try {
      const response = await apiClient.put(getApiUrl('/ai/config'), config);
      return response.data.config;
    } catch (error) {
      console.error('Error updating AI config:', error);
      throw new Error('Could not update AI configuration');
    }
  }
}

export default AiService;