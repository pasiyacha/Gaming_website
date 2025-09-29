import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [games, setGames] = useState([]);
  const [newPackage, setNewPackage] = useState({
    packagename: "",
    price: "",
    gamename: "",
    description: "",
    image: null,
    gameId: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [apiStatus, setApiStatus] = useState(null);

  // Test API connection - similar to Bank_Detail.jsx
  const testApiConnection = async () => {
    setLoading(true);
    setApiStatus("Testing API connection...");
    
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Try a GET request to test if the server is up
      console.log(`Testing endpoint: /api/package`);
      const res = await axios.get(getApiUrl('/api/package'), { headers });
      console.log(`API test response:`, res.data);
      setApiStatus(`API connection successful using endpoint: /api/package`);
    } catch (err) {
      console.error("API connection test failed:", err);
      setApiStatus(`API connection test failed: ${err.message}`);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  // Fetch packages
  useEffect(() => {
    fetchPackages();
    fetchGames();
    // Also test API connection when component mounts
    testApiConnection();
  }, []);

  // Debug log for packages and games
  useEffect(() => {
    console.log("Current packages data:", packages);
    console.log("Current games data:", games);
  }, [packages, games]);

  // Fetch available games
  const fetchGames = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!token) {
        console.error("Authentication token not found");
        setError("Authentication token not found. Please log in again.");
        return;
      }
      
      console.log("Fetching games data from /api/game...");
      const response = await axios.get(getApiUrl("/api/game"), { headers });
      
      console.log("Games response:", response.data);
      
      // Handle different response formats
      let gamesData = [];
      if (response.data && Array.isArray(response.data)) {
        gamesData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        gamesData = response.data.data;
      } else if (response.data && response.data.data) {
        gamesData = [response.data.data];
      }
      
      setGames(gamesData);
      
      // Save to localStorage as backup
      localStorage.setItem('gamesData', JSON.stringify(gamesData));
    } catch (error) {
      console.error("Error fetching games:", error);
      setError("Failed to fetch games: " + (error.response?.data?.message || error.message));
      
      // Try to get from local storage as fallback
      try {
        const localGamesData = localStorage.getItem('gamesData');
        if (localGamesData) {
          const parsedGames = JSON.parse(localGamesData);
          if (Array.isArray(parsedGames) && parsedGames.length > 0) {
            setGames(parsedGames);
            setError("Could not connect to the server. Using locally stored games data.");
          }
        }
      } catch (localError) {
        console.error("Error using local games fallback:", localError);
      }
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      console.log("Fetching packages from /api/package...");
      const response = await axios.get(getApiUrl("/api/package"), { headers });
      
      console.log("Packages response:", response.data);
      
      // Handle different response formats
      let packagesData = [];
      if (response.data && Array.isArray(response.data)) {
        packagesData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        packagesData = response.data.data;
      } else if (response.data && response.data.data) {
        packagesData = [response.data.data];
      }
      
      // Log the structure of the first package to debug image and gamename fields
      if (packagesData.length > 0) {
        console.log("First package structure:", JSON.stringify(packagesData[0], null, 2));
        console.log("Image field:", packagesData[0].image);
        console.log("Game name field:", packagesData[0].gamename);
        console.log("Game ID field:", packagesData[0].gameId);
      }
      
      setPackages(packagesData);
      setSuccess("Packages loaded successfully");
      setTimeout(() => setSuccess(""), 3000);
      
      // Save to localStorage as backup
      localStorage.setItem('packagesData', JSON.stringify(packagesData));
    } catch (error) {
      console.error("Error fetching packages:", error);
      setError("Failed to fetch packages: " + (error.response?.data?.message || error.message));
      
      // Try to use local storage as fallback
      try {
        const localData = localStorage.getItem('packagesData');
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setPackages(parsedData);
            setError("Could not connect to the server. Using locally stored packages data.");
          }
        }
      } catch (localError) {
        console.error("Error using local fallback:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (editingPackage) {
      setEditingPackage({ ...editingPackage, [name]: value });
    } else {
      setNewPackage({ ...newPackage, [name]: value });
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, JPG, GIF)");
      return;
    }
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB");
      return;
    }
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      if (editingPackage) {
        setEditingPackage({ ...editingPackage, image: file });
      } else {
        setNewPackage({ ...newPackage, image: file });
      }
    };
    reader.readAsDataURL(file);
  };

  // Add package
  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Client-side validation
    if (newPackage.description.length < 10) {
      setError("Description must be at least 10 characters long");
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      // Find the selected game to get its ID
      const selectedGame = games.find(game => game.gamename === newPackage.gamename);
      
      if (!selectedGame || !selectedGame._id) {
        setError("Please select a valid game from the dropdown. The selected game was not found.");
        setLoading(false);
        return;
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('packagename', newPackage.packagename);
      formData.append('price', newPackage.price);
      formData.append('gamename', newPackage.gamename);
      formData.append('description', newPackage.description);
      formData.append('gameId', selectedGame._id);
      
      // If there's an image file, append it
      if (newPackage.image instanceof File) {
        formData.append('image', newPackage.image);
      }
      
      console.log("Adding package with data:", {
        packagename: newPackage.packagename,
        price: newPackage.price,
        gamename: newPackage.gamename,
        description: newPackage.description,
        gameId: selectedGame._id,
        hasImage: newPackage.image instanceof File
      });
      
      const response = await axios.post(
        getApiUrl("/api/package"), 
        formData,
        { 
          headers: {
            ...headers,
            // Don't set Content-Type as it's automatically set with boundary for FormData
          }
        }
      );
      
      console.log("Package added response:", response.data);
      
      setNewPackage({ 
        packagename: "", 
        price: "", 
        gamename: "", 
        description: "",
        image: null,
        gameId: ""
      });
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      setSuccess("Package added successfully!");
      
      // Add to localStorage as backup
      const localData = localStorage.getItem('packagesData') ? 
        JSON.parse(localStorage.getItem('packagesData')) : [];
      
      localData.push({
        packagename: newPackage.packagename,
        price: newPackage.price,
        gamename: newPackage.gamename,
        description: newPackage.description,
        gameId: selectedGame._id,
        image: response.data.image || response.data.imageUrl || '',
        _id: response.data._id || Date.now().toString(),
        createdAt: new Date().toISOString()
      });
      
      localStorage.setItem('packagesData', JSON.stringify(localData));
      
      fetchPackages();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error adding package:", error.response?.data || error.message);
      
      // Detailed error reporting
      let errorMessage = "Failed to add package: ";
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        
        errorMessage += `Server responded with status: ${error.response.status}. `;
        
        if (error.response.data && typeof error.response.data === 'object') {
          if (error.response.data.message) {
            errorMessage += error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage += error.response.data.error;
          } else {
            errorMessage += JSON.stringify(error.response.data);
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        }
      } else if (error.request) {
        errorMessage += "No response received from server. Please check your connection.";
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      
      // Create in localStorage if API fails
      try {
        const localData = localStorage.getItem('packagesData') ? 
          JSON.parse(localStorage.getItem('packagesData')) : [];
        
        // Find the selected game to get its ID again, for error handling
        const selectedGameForFallback = games.find(game => game.gamename === newPackage.gamename);
        
        // For localStorage, we can't store the actual File object
        // so we'll just remember that we had an image
        const newPkg = { 
          packagename: newPackage.packagename,
          price: newPackage.price,
          gamename: newPackage.gamename,
          description: newPackage.description,
          gameId: selectedGameForFallback?._id || '',
          _id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        localData.push(newPkg);
        localStorage.setItem('packagesData', JSON.stringify(localData));
        setPackages([...packages, newPkg]);
        setSuccess("Added to local storage only. Server connection failed.");
      } catch (localError) {
        console.error("Error saving to local storage:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update package
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Client-side validation
    if (editingPackage.description.length < 10) {
      setError("Description must be at least 10 characters long");
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      // Find the selected game to get its ID
      const selectedGame = games.find(game => game.gamename === editingPackage.gamename);
      
      if (!selectedGame || !selectedGame._id) {
        setError("Please select a valid game from the dropdown. The selected game was not found.");
        setLoading(false);
        return;
      }
      
      let response;
      
      // Check if we're uploading a new image or just updating text data
      if (editingPackage.image instanceof File) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('packagename', editingPackage.packagename);
        formData.append('price', editingPackage.price);
        formData.append('gamename', editingPackage.gamename);
        formData.append('description', editingPackage.description);
        formData.append('gameId', selectedGame._id);
        formData.append('image', editingPackage.image);
        
        console.log("Updating package with image:", {
          id: editingPackage._id,
          packagename: editingPackage.packagename,
          hasImage: true
        });
        
        response = await axios.put(
          getApiUrl(`/api/package/${editingPackage._id}`),
          formData,
          { 
            headers: {
              ...headers,
              // Don't set Content-Type as it's automatically set with boundary for FormData
            }
          }
        );
      } else {
        // If no new image, use regular JSON
        const packageData = {
          packagename: editingPackage.packagename,
          price: editingPackage.price,
          gamename: editingPackage.gamename,
          description: editingPackage.description,
          gameId: selectedGame._id
        };
        
        // If there's an existing image URL, keep it
        if (typeof editingPackage.image === 'string' && editingPackage.image) {
          packageData.keepExistingImage = true;
        }
        
        console.log("Updating package with data:", packageData);
        
        response = await axios.put(
          getApiUrl(`/api/package/${editingPackage._id}`),
          packageData,
          { 
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            } 
          }
        );
      }
      
      console.log("Package updated response:", response?.data);
      
      setSuccess("Package updated successfully!");
      
      // Update localStorage as backup
      const localData = localStorage.getItem('packagesData') ? 
        JSON.parse(localStorage.getItem('packagesData')) : [];
      
      const index = localData.findIndex(pkg => pkg._id === editingPackage._id);
      if (index !== -1) {
        localData[index] = { 
          ...localData[index], 
          packagename: editingPackage.packagename,
          price: editingPackage.price,
          gamename: editingPackage.gamename,
          description: editingPackage.description,
          gameId: selectedGame._id,
          image: response?.data?.image || response?.data?.imageUrl || localData[index].image,
          updatedAt: new Date().toISOString() 
        };
        localStorage.setItem('packagesData', JSON.stringify(localData));
      }
      
      setEditingPackage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchPackages();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating package:", error.response?.data || error.message);
      
      // Detailed error reporting
      let errorMessage = "Failed to update package: ";
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        
        errorMessage += `Server responded with status: ${error.response.status}. `;
        
        if (error.response.data && typeof error.response.data === 'object') {
          if (error.response.data.message) {
            errorMessage += error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage += error.response.data.error;
          } else {
            errorMessage += JSON.stringify(error.response.data);
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        }
      } else if (error.request) {
        errorMessage += "No response received from server. Please check your connection.";
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete package
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this package?")) {
      return;
    }
    
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      console.log(`Deleting package with ID: ${id}`);
      
      await axios.delete(
        getApiUrl(`/api/package/${id}`),
        { headers }
      );
      
      setSuccess("Package deleted successfully!");
      
      // Update localStorage as backup
      const localData = localStorage.getItem('packagesData') ? 
        JSON.parse(localStorage.getItem('packagesData')) : [];
      
      const filteredData = localData.filter(pkg => pkg._id !== id);
      localStorage.setItem('packagesData', JSON.stringify(filteredData));
      
      fetchPackages();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting package:", error.response?.data || error.message);
      
      // Detailed error reporting
      let errorMessage = "Failed to delete package: ";
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        
        errorMessage += `Server responded with status: ${error.response.status}. `;
        
        if (error.response.data && typeof error.response.data === 'object') {
          if (error.response.data.message) {
            errorMessage += error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage += error.response.data.error;
          } else {
            errorMessage += JSON.stringify(error.response.data);
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        }
      } else if (error.request) {
        errorMessage += "No response received from server. Please check your connection.";
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Available Packages</h2>

      {/* API Status Panel */}
      {apiStatus && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <p>{apiStatus}</p>
            <div>
              <button 
                onClick={testApiConnection} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                disabled={loading}
              >
                Test API
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
          <button 
            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            onClick={fetchPackages}
          >
            Try Again
          </button>
        </div>
      )}
      <form
        onSubmit={editingPackage ? handleUpdate : handleAdd}
        className="mb-6 p-6 bg-gray-200 rounded"
      >
        <h3 className="text-lg font-semibold mb-2">
          {editingPackage ? "Edit Package" : "Add New Package"}
        </h3>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <input
          type="text"
          name="packagename"
          placeholder="Package Name"
          value={editingPackage ? editingPackage.packagename : newPackage.packagename}
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        />
        <input
          type="text"
          name="price"
          placeholder="Price"
          value={editingPackage ? editingPackage.price : newPackage.price}
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        />
        
        {/* Game selection dropdown */}
        <select
          name="gamename"
          value={editingPackage ? editingPackage.gamename : newPackage.gamename}
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        >
          <option value="">Select a Game</option>
          {games.map((game) => (
            <option key={game._id} value={game.gamename}>
              {game.gamename}
            </option>
          ))}
        </select>
        
        <textarea
          name="description"
          placeholder="Description (minimum 10 characters)"
          value={
            editingPackage ? editingPackage.description : newPackage.description
          }
          onChange={handleChange}
          className={`border p-2 w-full mb-1 ${
            (editingPackage && editingPackage.description.length < 10) || 
            (!editingPackage && newPackage.description.length < 10 && newPackage.description.length > 0) 
              ? 'border-red-500' 
              : ''
          }`}
          required
        />
        <div className="text-xs text-gray-500 mb-4 flex justify-between">
          <span>Minimum 10 characters required</span>
          <span>
            {editingPackage 
              ? `${editingPackage.description.length}/10 characters` 
              : `${newPackage.description.length}/10 characters`}
          </span>
        </div>
        
        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Package Image
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              id="packageImageUpload"
            />
            <label
              htmlFor="packageImageUpload"
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm flex-grow flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {editingPackage?.image 
                ? (typeof editingPackage.image === 'string' 
                    ? 'Change image' 
                    : `Selected: ${editingPackage.image.name.substring(0, 15)}${editingPackage.image.name.length > 15 ? '...' : ''}`) 
                : newPackage?.image?.name 
                    ? `Selected: ${newPackage.image.name.substring(0, 15)}${newPackage.image.name.length > 15 ? '...' : ''}`
                    : 'Choose image file...'}
            </label>
            <button
              type="button"
              onClick={() => {
                if (editingPackage) {
                  setEditingPackage({ ...editingPackage, image: null });
                } else {
                  setNewPackage({ ...newPackage, image: null });
                }
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Image Preview */}
          <div className="mt-2">
            <div className="relative w-32 h-32 border rounded overflow-hidden bg-gray-100">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (editingPackage && (typeof editingPackage.image === 'string' && editingPackage.image)) ? (
                <img 
                  src={editingPackage.image.startsWith('http') ? editingPackage.image : getApiUrl(`/${editingPackage.image}`)} 
                  alt={editingPackage.packagename} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/100?text=No+Image";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-500 text-xs text-center p-2">
                  <span>No image selected</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className={`${
            editingPackage ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"
          } text-white px-4 py-2 rounded transition-colors`}
          disabled={loading || 
            (editingPackage && editingPackage.description.length < 10) || 
            (!editingPackage && newPackage.description.length < 10)}
        >
          {loading 
            ? (editingPackage ? "Updating..." : "Adding...") 
            : (editingPackage ? "Update Package" : "Add Package")}
        </button>
        
        {/* Form validation helper text */}
        {((editingPackage && editingPackage.description.length < 10) || 
          (!editingPackage && newPackage.description.length < 10)) && (
          <div className="mt-2 text-sm text-orange-600">
            <p>Note: Button will be enabled when description has at least 10 characters</p>
          </div>
        )}
      </form>

      {/* Packages Table */}
      {loading ? (
        <div className="text-center py-4">
          <p>Loading packages...</p>
        </div>
      ) : error && packages.length === 0 ? (
        <div className="text-center py-4 text-red-500">
          <p>{error}</p>
        </div>
      ) : packages.length === 0 ? (
        <p>No packages found.</p>
      ) : (
        <table className="w-full border border-gray-300 rounded">
          <thead className="bg-[#0e08ab] text-white">
            <tr>
              <th className="border p-2">Package ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Game</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Image</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg._id} className="text-center bg-gray-100">
                <td className="border p-2">{pkg._id}</td>
                <td className="border p-2">{pkg.packagename}</td>
                <td className="border p-2">{pkg.price}</td>
                <td className="border p-2">
                  {pkg.gamename || 
                   (pkg.gameId && games.find(g => g._id === pkg.gameId)?.gamename) || 
                   "Unknown Game"}
                </td>
                <td className="border p-2">{pkg.description}</td>
                <td className="border p-2">
                  {pkg.image ? (
                    <div className="h-16 w-16 mx-auto overflow-hidden rounded bg-gray-100">
                      <img 
                        src={pkg.image.startsWith('http') ? pkg.image : getApiUrl(`/${pkg.image}`)} 
                        alt={pkg.packagename} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/100?text=Error";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 mx-auto flex items-center justify-center bg-gray-200 rounded">
                      <span className="text-xs text-gray-500">No image</span>
                    </div>
                  )}
                </td>
                <td className="border p-2 space-x-2">
                  <button
                    onClick={() => {
                      // When editing, set up the image preview if there's an image URL
                      if (pkg.image && typeof pkg.image === 'string') {
                        // Check if the image URL is relative or absolute
                        const imgpublic = pkg.image.startsWith('http') ? pkg.image : getApiUrl(`/${pkg.image}`);
                        setImagePreview(imgpublic);
                      } else {
                        setImagePreview(null);
                      }
                      setEditingPackage(pkg);
                      // Reset file input
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Database Connection Status */}
      <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
        <div>
          <p>Total Packages: {packages.length}</p>
        </div>
        <div>
          <button 
            onClick={fetchPackages} 
            className="text-blue-600 hover:text-blue-800 underline"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Packages;
