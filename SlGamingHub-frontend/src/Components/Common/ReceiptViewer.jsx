import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/apiConfig';

/**
 * Component for viewing receipt images with proper error handling
 * 
 * @param {Object} props Component props
 * @param {string} props.orderId The ID of the order to get the receipt for
 * @param {string} props.receiptUrl Optional direct URL to the receipt image
 * @param {Function} props.onClose Function to call when closing the viewer
 * @param {boolean} props.showDownloadButton Whether to show the download button
 */
const ReceiptViewer = ({ 
  orderId, 
  receiptUrl, 
  onClose, 
  showDownloadButton = true 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(receiptUrl || null);
  
  // Fetch receipt data when component mounts
  useEffect(() => {
    if (!receiptUrl && orderId) {
      validateReceipt();
    } else if (receiptUrl) {
      setLoading(false);
    }
  }, [orderId, receiptUrl]);
  
  // Validate receipt existence and get proper URL
  const validateReceipt = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${getApiUrl()}/api/receipts/validate/${orderId}`);
      
      if (response.data.success) {
        setImageUrl(response.data.imageUrl);
      } else {
        setError(response.data.message || 'Failed to validate receipt image');
      }
    } catch (err) {
      console.error('Error validating receipt:', err);
      setError('Error loading receipt. The image might be corrupted or unavailable.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle image load error
  const handleImageError = () => {
    setError('Error loading the receipt image. The image might be corrupted or unavailable.');
  };
  
  // Generate a fallback image for errors
  const fallbackImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNDAgNTBINjBNNTAgNDBWNjAiIHN0cm9rZT0iIzZCN0NCRCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=";
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Bank Receipt</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Loading receipt image...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-500">{error}</p>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={imageUrl} 
                alt="Bank Receipt" 
                className="max-w-full max-h-[70vh] object-contain"
                onError={handleImageError}
              />
              {!error && (
                <div className="absolute bottom-2 right-2">
                  <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Original
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Close
          </button>
          
          {showDownloadButton && imageUrl && !error && !loading && (
            <a 
              href={imageUrl}
              download="receipt.jpg"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          )}
          
          {/* Retry button if there was an error */}
          {error && orderId && (
            <button
              onClick={validateReceipt}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;