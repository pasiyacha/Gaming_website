/**
 * Test script to verify order creation fixes
 * 
 * This script tests that the order creation process works correctly 
 * with the improved error handling, image processing, and email handling.
 * 
 * Instructions to test:
 * 1. Run this script with node: `node test-order-fix.js`
 * 2. Check the console output for success/failure messages
 * 3. If successful, try creating an order through the frontend interface
 * 
 * Fixes implemented:
 * - Image upload and processing improvements
 * - Made email sending optional (won't fail if email not configured)
 * - Better error handling throughout the order process
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_IMAGE_PATH = path.join(__dirname, 'SlGamingHub-backend', 'uploads', 'package-1756246327158.jpeg');
let authToken = null;

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// Functions to test the fixes
async function login() {
  try {
    console.log('🔑 Attempting login...');
    const response = await axios.post(`${API_URL}/api/users/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful! Received auth token.');
    return response.data.user;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw new Error('Login failed, cannot proceed with tests');
  }
}

async function getTestData() {
  try {
    console.log('📊 Fetching test data (package and user)...');
    
    // Get a package to use for testing
    const packagesResponse = await axios.get(`${API_URL}/api/package`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!packagesResponse.data || packagesResponse.data.length === 0) {
      throw new Error('No packages found for testing');
    }
    
    const testPackage = packagesResponse.data[0];
    console.log(`✅ Found package: ${testPackage.packagename}`);
    
    return { testPackage };
  } catch (error) {
    console.error('❌ Error fetching test data:', error.response?.data || error.message);
    throw error;
  }
}

async function testCreateOrder(userId, packageData) {
  try {
    console.log('🛒 Creating a test order...');
    
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`❌ Test image not found at ${TEST_IMAGE_PATH}`);
      throw new Error('Test image file not found');
    }
    
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('packageId', packageData._id);
    formData.append('playerName', 'Test Player');
    formData.append('playerId', 'PLAYER123');
    formData.append('quantity', 1);
    formData.append('totalPrice', packageData.price);
    formData.append('recipt', fs.createReadStream(TEST_IMAGE_PATH));
    
    console.log('📤 Sending order data to API...');
    
    const response = await axios.post(`${API_URL}/api/order`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Order created successfully!');
    console.log('📋 Order details:', {
      orderId: response.data._id,
      status: response.data.status,
      receipt: response.data.recipt
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Order creation failed:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('🧪 Starting order fix test...');
    
    const user = await login();
    const { testPackage } = await getTestData();
    const order = await testCreateOrder(user._id, testPackage);
    
    console.log('🎉 All tests passed successfully!');
    console.log('✅ The MongoDB save error has been fixed.');
    console.log(`\nNext steps: Try placing an order through the frontend interface to verify the fix works end-to-end.`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();