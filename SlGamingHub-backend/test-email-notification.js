/**
 * Test script to verify order completion email functionality
 * 
 * This script will test the email notification system for completed orders
 * by directly calling the relevant functions
 * 
 * Usage: node test-email-notification.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const sendEmail = require('./utils/sendEmail');
const { sendCompletionNotification } = require('./utils/backupNotification');

// Test email
const TEST_EMAIL = process.env.TEST_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_USER;

// Sample order data for testing
const sampleOrder = {
  _id: 'TEST-' + new Date().getTime(),
  playerName: 'Test Player',
  playerId: 'PLAYER123',
  totalPrice: 19.99,
  date: new Date(),
  game: 'Test Game',
  package: 'Test Package'
};

// Function to test primary email system
async function testPrimaryEmail() {
  console.log('=== Testing Primary Email System ===');
  console.log(`Sending test email to: ${TEST_EMAIL}`);
  
  try {
    const result = await sendEmail(
      TEST_EMAIL,
      'SL Gaming Hub - Email System Test',
      `This is a test email from the SL Gaming Hub system.
      
If you're receiving this email, it means the primary email system is working correctly.

Test time: ${new Date().toLocaleString()}
      
This is an automated test message.`
    );
    
    console.log('Email result:', result);
    if (result.success) {
      console.log('✓ Primary email system is working!');
    } else {
      console.log('✗ Primary email system failed:', result.reason);
    }
    return result;
  } catch (error) {
    console.error('Error testing primary email system:', error);
    return { success: false, error };
  }
}

// Function to test backup notification system
async function testBackupNotification() {
  console.log('\n=== Testing Backup Notification System ===');
  
  try {
    const result = await sendCompletionNotification(
      TEST_EMAIL,
      sampleOrder._id,
      sampleOrder
    );
    
    console.log('Backup notification result:', result);
    if (result.logged) {
      console.log('✓ Notification successfully logged to file');
    } else {
      console.log('✗ Failed to log notification to file');
    }
    
    if (result.webhook) {
      console.log('✓ Webhook notification sent successfully');
    } else {
      console.log('✗ Webhook notification failed or not configured');
    }
    
    return result;
  } catch (error) {
    console.error('Error testing backup notification system:', error);
    return { success: false, error };
  }
}

// Run all tests
async function runTests() {
  console.log('=== Email Notification System Test ===');
  console.log('Testing date:', new Date().toLocaleString());
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  // Check if email is properly configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n⚠️ Email system is not fully configured in your .env file');
    console.log('The following variables should be set:');
    console.log('- SMTP_HOST (e.g., smtp.gmail.com)');
    console.log('- SMTP_PORT (e.g., 587)');
    console.log('- SMTP_USER (your email address)');
    console.log('- SMTP_PASS (your email password or app password)');
    console.log('\nWill still run tests to check fallback mechanisms...');
  }
  
  // Test primary email first
  const emailResult = await testPrimaryEmail();
  
  // Then test backup notification system
  const backupResult = await testBackupNotification();
  
  // Summary
  console.log('\n=== Test Summary ===');
  if (emailResult.success) {
    console.log('✓ Primary email system: WORKING');
    console.log('  Your completed order emails should be delivered correctly!');
  } else {
    console.log('✗ Primary email system: FAILED');
    console.log(`  Error: ${emailResult.reason || 'Unknown error'}`);
    
    if (backupResult.logged) {
      console.log('✓ Backup logging system: WORKING');
      console.log('  Order completions will be logged to files even if emails fail');
    } else {
      console.log('✗ Backup logging system: FAILED');
    }
    
    if (backupResult.webhook) {
      console.log('✓ Webhook notification: WORKING');
      console.log('  Order completions will be sent via webhook');
    } else {
      console.log('✗ Webhook notification: NOT CONFIGURED or FAILED');
    }
  }
  
  console.log('\n=== Recommendations ===');
  if (!emailResult.success) {
    console.log('1. Check your SMTP settings in .env file');
    console.log('2. For Gmail, ensure you\'re using an App Password if 2FA is enabled');
    console.log('3. Try setting SMTP_SECURE=true if you\'re using port 465');
    console.log('4. Consider adding a NOTIFICATION_WEBHOOK for backup notifications');
  } else {
    console.log('Your email system appears to be working correctly!');
    console.log('For added reliability, you may want to:');
    console.log('1. Set ADMIN_EMAIL in your .env file for admin notifications');
    console.log('2. Configure NOTIFICATION_WEBHOOK as a backup notification channel');
  }
  
  console.log('\nTest completed.');
}

// Run the tests
runTests().catch(error => {
  console.error('Unexpected error during testing:', error);
});