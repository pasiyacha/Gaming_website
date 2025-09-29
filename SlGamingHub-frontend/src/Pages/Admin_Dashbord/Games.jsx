import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import placeholderGameImage from "../../assets/placeholder.js";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";

const Games = () => {
  const [games, setGames] = useState([]);
  const [newGame, setNewGame] = useState({
    gamename: "",
    description: "",
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [editingGame, setEditingGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [apiStatus, setApiStatus] = useState(null);

  // Function to convert base64 to File object for upload
  const base64ToFile = (base64String) => {
    // Remove the data:image/png;base64, prefix
    const base64Data = base64String.split(',')[1] || base64String;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: 'image/png' });
    return new File([blob], 'default-game-image.png', { type: 'image/png' });
  };

  // Use placeholder image if no image is selected
  const getDefaultImageFile = () => {
    return base64ToFile(placeholderGameImage);
  };

  // Test API connection
  const testApiConnection = async () => {
    setLoading(true);
    setApiStatus("Testing API connection...");
    
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Try a GET request to test if the server is up
      console.log(`Testing endpoint: /api/game`);
      const res = await axios.get(getApiUrl('/api/game'), { headers });
      console.log(`API test response:`, res.data);
      setApiStatus(`API connection successful using endpoint: /api/game`);
    } catch (err) {
      console.error("API connection test failed:", err);
      setApiStatus(`API connection test failed: ${err.message}`);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  // Fetch games
  const fetchGames = async () => {
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
      
      console.log("Fetching games from /api/game...");
      const response = await axios.get(getApiUrl('/api/game'), { headers });
      
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
      setSuccess("Games loaded successfully");
      setTimeout(() => setSuccess(""), 3000);
      
      // Save to localStorage as backup
      localStorage.setItem('gamesData', JSON.stringify(gamesData));
    } catch (error) {
      console.error("Error fetching games:", error);
      setError("Failed to fetch games: " + (error.response?.data?.message || error.message));
      
      // Try to use local storage as fallback
      try {
        const localData = localStorage.getItem('gamesData');
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setGames(parsedData);
            setError("Could not connect to the server. Using locally stored games data.");
          }
        }
      } catch (localError) {
        console.error("Error using local fallback:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // Also test API connection when component mounts
    testApiConnection();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (editingGame) {
      setEditingGame({ ...editingGame, [name]: value });
    } else {
      setNewGame({ ...newGame, [name]: value });
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
      if (editingGame) {
        setEditingGame({ ...editingGame, image: file });
      } else {
        setNewGame({ ...newGame, image: file });
      }
    };
    reader.readAsDataURL(file);
  };

  // Add game
  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      // If no image is provided, set a default one
      let gameImage = newGame.image;
      if (!gameImage) {
        try {
          gameImage = getDefaultImageFile();
          console.log("Using default game image");
        } catch (err) {
          console.error("Error creating default image:", err);
          setError("Please select an image file for the game");
          setLoading(false);
          return;
        }
      }
      
      const token = localStorage.getItem("token");
      // Remove 'Content-Type' header to let axios set it properly with boundary for FormData
      const headers = token ? { 
        Authorization: `Bearer ${token}` 
      } : {};
      
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('gamename', newGame.gamename);
      formData.append('description', newGame.description);
      
      // Log FormData contents for debugging
      console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      // Use the gameImage variable which could be the selected image or default
      if (gameImage) {
        formData.append('image', gameImage);
        console.log("Appended image:", gameImage instanceof File ? gameImage.name : "Base64 image");
      }
      
      console.log("Adding game with data:", {
        name: newGame.gamename,
        description: newGame.description,
        hasImage: !!gameImage
      });
      
      // Debug FormData values after all appends
      console.log("Final FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      const response = await axios.post(
        getApiUrl('/api/game'), 
        formData,
        { headers }
      );
      
      console.log("Game added response:", response.data);
      
      setNewGame({ 
        gamename: "", 
        description: "",
        image: null
      });
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      setSuccess("Game added successfully!");
      
      // Add to localStorage as backup (store image URL from response)
      const localData = localStorage.getItem('gamesData') ? 
        JSON.parse(localStorage.getItem('gamesData')) : [];
      
      const gameToStore = {
        gamename: newGame.gamename,
        description: newGame.description,
        // Store the URL returned from the server instead of the file object
        image: response.data.image || response.data.imageUrl || '',
        _id: response.data._id || Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      localData.push(gameToStore);
      localStorage.setItem('gamesData', JSON.stringify(localData));
      
      fetchGames();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error adding game:", error.response?.data || error.message);
      
      // Detailed error reporting
      let errorMessage = "Failed to add game: ";
      
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

  // Handle editing a game
  const handleEditClick = (game) => {
    // Create a shallow copy of the game object to avoid direct state mutation
    const gameToEdit = { ...game };
    
    // Check if the image is a string URL
    if (typeof gameToEdit.image === 'string') {
      // Store the original image URL as a separate property
      gameToEdit.originalImageUrl = gameToEdit.image;
      
      // When editing an existing game with an image URL, we need to 
      // handle this specially to ensure proper form submission
      console.log("Editing game with image URL:", gameToEdit.image);
    }
    
    setEditingGame(gameToEdit);
    
    // Set the image preview for the existing image
    if (gameToEdit.image && typeof gameToEdit.image === 'string') {
      setImagePreview(gameToEdit.image);
    } else {
      setImagePreview(null);
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle updating a game
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Determine what kind of image we're working with
      let gameImage = editingGame.image;
      
      const token = localStorage.getItem("token");
      const headers = token ? { 
        Authorization: `Bearer ${token}`
      } : {};
      
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      let response;
      
      // Check if we're uploading a new image file
      if (gameImage instanceof File) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('gamename', editingGame.gamename);
        formData.append('description', editingGame.description);
        formData.append('image', gameImage);
        
        console.log("Uploading with FormData - new image file:", gameImage.name);
        
        // Debug FormData values
        console.log("FormData entries:");
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value instanceof File ? value.name : value}`);
        }
        
        response = await axios.put(
          getApiUrl(`/api/game/${editingGame._id}`),
          formData,
          { 
            headers: {
              ...headers,
              // Ensure Content-Type is not set for FormData
            }
          }
        );
      } else {
        // No new image file, use JSON for more reliable data transfer
        const updateData = {
          gamename: editingGame.gamename,
          description: editingGame.description
        };
        
        // If we have an existing image URL, tell the server to keep it
        if (typeof gameImage === 'string' && gameImage) {
          updateData.keepExistingImage = true;
          console.log("Using existing image URL in JSON request");
        }
        
        console.log("Updating with JSON data:", updateData);
        
        response = await axios.put(
          getApiUrl(`/api/game/${editingGame._id}`),
          updateData,
          { 
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            } 
          }
        );
      }
      
      console.log("Game updated response:", response.data);
      
      setSuccess("Game updated successfully!");
      
      // Update localStorage as backup
      const localData = localStorage.getItem('gamesData') ? 
        JSON.parse(localStorage.getItem('gamesData')) : [];
      
      const index = localData.findIndex(game => game._id === editingGame._id);
      if (index !== -1) {
        localData[index] = { 
          ...localData[index], 
          gamename: editingGame.gamename,
          description: editingGame.description,
          // If we got an image URL back from the server, use that, otherwise keep existing
          image: response.data.image || response.data.imageUrl || localData[index].image,
          updatedAt: new Date().toISOString() 
        };
        localStorage.setItem('gamesData', JSON.stringify(localData));
      }
      
      setEditingGame(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchGames();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating game:", error.response?.data || error.message);
      
      // Detailed error reporting
      let errorMessage = "Failed to update game: ";
      
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

  // Delete game
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this game? This will also delete all associated packages.")) {
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
      
      console.log(`Deleting game with ID: ${id}`);
      
      await axios.delete(
        getApiUrl(`/api/game/${id}`),
        { headers }
      );
      
      setSuccess("Game deleted successfully!");
      
      // Update localStorage as backup
      const localData = localStorage.getItem('gamesData') ? 
        JSON.parse(localStorage.getItem('gamesData')) : [];
      
      const filteredData = localData.filter(game => game._id !== id);
      localStorage.setItem('gamesData', JSON.stringify(filteredData));
      
      // Clear editing state if deleting the game that's being edited
      if (editingGame && editingGame._id === id) {
        setEditingGame(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      
      fetchGames();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting game:", error.response?.data || error.message);
      
      // Detailed error reporting
      let errorMessage = "Failed to delete game: ";
      
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
      <h2 className="text-xl font-bold mb-4">Manage Games</h2>

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
            onClick={fetchGames}
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Form for adding/editing games */}
      <form
        onSubmit={editingGame ? handleUpdate : handleAdd}
        className="mb-6 p-6 bg-gray-200 rounded"
      >
        <h3 className="text-lg font-semibold mb-2">
          {editingGame ? "Edit Game" : "Add New Game"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Game Name
            </label>
            <input
              type="text"
              name="gamename"
              placeholder="Enter game name"
              value={editingGame ? editingGame.gamename : newGame.gamename}
              onChange={handleChange}
              className="border p-2 w-full rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Game Image <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                id="gameImageUpload"
                required={!editingGame?.image}
              />
              <label
                htmlFor="gameImageUpload"
                className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm flex-grow flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {editingGame?.image?.name || editingGame?.image 
                  ? (typeof editingGame.image === 'string' 
                      ? 'Change image' 
                      : `Selected: ${editingGame.image.name.substring(0, 15)}${editingGame.image.name.length > 15 ? '...' : ''}`) 
                  : newGame?.image?.name 
                      ? `Selected: ${newGame.image.name.substring(0, 15)}${newGame.image.name.length > 15 ? '...' : ''}`
                      : 'Choose image file...'}
              </label>
              <button
                type="button"
                onClick={() => {
                  if (editingGame) {
                    setEditingGame({ ...editingGame, image: null });
                  } else {
                    setNewGame({ ...newGame, image: null });
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
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderGameImage;
                    }}
                  />
                ) : (editingGame && (typeof editingGame.image === 'string' && editingGame.image)) ? (
                  <img 
                    src={editingGame.image} 
                    alt={editingGame.gamename} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderGameImage;
                    }}
                  />
                ) : (
                  <>
                    <img 
                      src={placeholderGameImage} 
                      alt="Default game placeholder" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-center text-xs p-2">
                      <span className="bg-black bg-opacity-50 text-white p-1 rounded">Select an image</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            placeholder="Enter game description"
            value={editingGame ? editingGame.description : newGame.description}
            onChange={handleChange}
            className="border p-2 w-full rounded h-24"
            required
          />
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className={`${
              editingGame ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"
            } text-white px-4 py-2 rounded`}
            disabled={loading}
          >
            {loading 
              ? (editingGame ? "Updating..." : "Adding...") 
              : (editingGame ? "Update Game" : "Add Game")}
          </button>
          
          {editingGame && (
            <button
              type="button"
              onClick={() => setEditingGame(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Preview of the current game (when editing) */}
      {editingGame && (
        <div className="mb-6 p-4 border border-blue-300 bg-blue-50 rounded">
          <h3 className="text-lg font-semibold mb-2">Game Preview</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-40 h-40 overflow-hidden rounded bg-gray-100">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt={editingGame.gamename} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderGameImage;
                  }}
                />
              ) : editingGame?.image ? (
                <img 
                  src={typeof editingGame.image === 'string' ? editingGame.image : URL.createObjectURL(editingGame.image)} 
                  alt={editingGame.gamename} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderGameImage;
                  }}
                />
              ) : (
                <img 
                  src={placeholderGameImage} 
                  alt="Game placeholder" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold">{editingGame.gamename || "Game Name"}</h4>
              <p className="mt-2 text-gray-600">{editingGame.description || "No description available"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Games Table */}
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          <p className="mt-2">Loading games...</p>
        </div>
      ) : error && games.length === 0 ? (
        <div className="text-center py-4 text-red-500">
          <p>{error}</p>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-10 bg-gray-100 rounded">
          <p className="text-lg text-gray-600">No games found. Add your first game using the form above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded">
            <thead className="bg-[#0e08ab] text-white">
              <tr>
                <th className="border p-2">Game Name</th>
                <th className="border p-2">Image</th>
                <th className="border p-2">Description</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game._id} className="text-center bg-gray-100 hover:bg-gray-200 transition-colors">
                  <td className="border p-2 font-medium">{game.gamename}</td>
                  <td className="border p-2">
                    <div className="h-16 w-16 mx-auto overflow-hidden rounded bg-gray-100">
                      <img 
                        src={game.image || placeholderGameImage} 
                        alt={game.gamename || "Game"} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderGameImage;
                        }}
                      />
                    </div>
                  </td>
                  <td className="border p-2 text-left">
                    <div className="max-h-20 overflow-y-auto">
                      {game.description}
                    </div>
                  </td>
                  <td className="border p-2">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={() => handleEditClick(game)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(game._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Database Connection Status */}
      <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
        <div>
          <p>Total Games: {games.length}</p>
        </div>
        <div>
          <button 
            onClick={fetchGames} 
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

export default Games;
