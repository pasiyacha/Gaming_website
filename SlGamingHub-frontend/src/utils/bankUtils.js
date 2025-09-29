import { getAllBanks } from './mockBankApi';

/**
 * Fetches bank details for display in user interfaces
 * @returns {Promise<Array>} Array of bank details
 */
export const fetchBankDetails = async () => {
  try {
    // Get bank details from the mock API
    return getAllBanks();
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return [];
  }
};

/**
 * Gets a formatted string of bank details for display
 * @returns {string} Formatted bank details text
 */
export const getFormattedBankDetails = () => {
  const banks = getAllBanks();
  
  if (!banks || banks.length === 0) {
    return 'No bank details available.';
  }
  
  // Format the first bank's details
  const bank = banks[0];
  return `Bank: ${bank.bankName}\nAccount Holder: ${bank.accountHolder}\nAccount Number: ${bank.accountNumber}\nBranch: ${bank.branch}`;
};

/**
 * Gets all bank details as HTML content
 * @returns {string} HTML content with bank details
 */
export const getBankDetailsHtml = () => {
  const banks = getAllBanks();
  
  if (!banks || banks.length === 0) {
    return '<p>No bank details available.</p>';
  }
  
  let html = '<div class="space-y-4">';
  
  banks.forEach(bank => {
    html += `
      <div class="border border-gray-300 rounded p-4 bg-gray-50">
        <h3 class="font-bold text-lg mb-2">${bank.bankName}</h3>
        <p><span class="font-medium">Account Holder:</span> ${bank.accountHolder}</p>
        <p><span class="font-medium">Account Number:</span> ${bank.accountNumber}</p>
        <p><span class="font-medium">Branch:</span> ${bank.branch}</p>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
};
