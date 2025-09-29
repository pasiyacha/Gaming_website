import React from 'react';

/**
 * A component to display QR codes for bank payment
 * @param {Object} props
 * @param {string} props.bankName - Name of the bank
 * @param {string} props.accountNumber - Account number
 * @param {string} props.className - Additional CSS classes
 */
const QRCodeDisplay = ({ bankName, accountNumber, className = "" }) => {
  // Generate a random color based on the bank name (just for visual variety)
  const getRandomColor = () => {
    const colors = ["bg-blue-100", "bg-green-100", "bg-purple-100", "bg-yellow-100"];
    // Simple hash function to get consistent color for the same bank
    const hash = bankName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  // This would be replaced with actual QR code in production
  // For now, it's a placeholder that looks like a QR code
  return (
    <div className={`p-2 rounded-lg flex flex-col items-center ${className}`}>
      <div className={`w-32 h-32 rounded-lg ${getRandomColor()} flex items-center justify-center border border-gray-300`}>
        {/* QR code placeholder */}
        <div className="w-28 h-28 bg-white rounded-md relative p-2 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-4 h-4 bg-black"></div>
            <div className="w-4 h-4 bg-black"></div>
          </div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center">
              <span className="text-[8px] text-black font-bold">{accountNumber.substring(0, 4)}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="w-4 h-4 bg-black"></div>
            <div className="w-4 h-4 bg-black"></div>
          </div>
        </div>
      </div>
      <p className="text-sm font-medium mt-2">{bankName}</p>
      <p className="text-xs text-gray-600 font-mono">{accountNumber}</p>
    </div>
  );
};

export default QRCodeDisplay;
