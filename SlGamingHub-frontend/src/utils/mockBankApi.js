// Mock API handlers for bank details using localStorage

// Initialize bank data in localStorage if it doesn't exist
const initBankData = () => {
  if (!localStorage.getItem('bankData')) {
    localStorage.setItem('bankData', JSON.stringify([]));
  }
};

// Initialize with some sample data if empty
export const initWithSampleData = () => {
  initBankData();
  const banks = getAllBanks();
  
  if (banks.length === 0) {
    const sampleBanks = [
      {
        _id: '1',
        accountHolder: 'K.W.A.Rasanga',
        accountNumber: '86800581',
        bankName: 'Bank of Ceylon',
        branch: 'Katuwana Branch',
        paymentType: 'bank',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        accountHolder: 'K.W.A.Rasanga',
        accountNumber: '115857695088',
        bankName: 'Sampath Bank',
        branch: 'Middeniya Branch',
        paymentType: 'bank',
        createdAt: new Date().toISOString()
      },
      {
        _id: '3',
        accountHolder: 'K.W.A.Rasanga',
        accountNumber: '0773043667',
        bankName: 'eZcash',
        branch: 'Mobile',
        paymentType: 'ezcash',
        createdAt: new Date().toISOString()
      },
      {
        _id: '4',
        accountHolder: 'K.W.A.Rasanga',
        accountNumber: '0741880764',
        bankName: 'eZcash',
        branch: 'Mobile',
        paymentType: 'ezcash',
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem('bankData', JSON.stringify(sampleBanks));
  }
  
  return getAllBanks(); // Return the banks after initialization
};

// Get all bank details
export const getAllBanks = () => {
  initBankData();
  return JSON.parse(localStorage.getItem('bankData'));
};

// Add a new bank
export const addBank = (bankData) => {
  const banks = getAllBanks();
  const newBank = {
    ...bankData,
    _id: Date.now().toString(), // Generate a unique ID
    createdAt: new Date().toISOString()
  };
  
  banks.push(newBank);
  localStorage.setItem('bankData', JSON.stringify(banks));
  return newBank;
};

// Update a bank
export const updateBank = (id, bankData) => {
  const banks = getAllBanks();
  const index = banks.findIndex(bank => bank._id === id);
  
  if (index === -1) {
    throw new Error('Bank not found');
  }
  
  banks[index] = {
    ...banks[index],
    ...bankData,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem('bankData', JSON.stringify(banks));
  return banks[index];
};

// Delete a bank
export const deleteBank = (id) => {
  const banks = getAllBanks();
  const filteredBanks = banks.filter(bank => bank._id !== id);
  
  if (filteredBanks.length === banks.length) {
    throw new Error('Bank not found');
  }
  
  localStorage.setItem('bankData', JSON.stringify(filteredBanks));
  return { success: true };
};

// Initialize with sample data immediately
initWithSampleData();
