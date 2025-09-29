
import React, { useState, useEffect } from "react";

const Settings = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );
  const [notifications, setNotifications] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  // Apply theme globally to body for full page effect
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("bg-gray-900", "text-white");
      document.body.classList.remove("bg-white", "text-black");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("bg-white", "text-black");
      document.body.classList.remove("bg-gray-900", "text-white");
      localStorage.setItem("theme", "light");
    }
    // Cleanup on unmount
    return () => {
      document.body.classList.remove("bg-gray-900", "text-white", "bg-white", "text-black");
    };
  }, [theme]);

  const handleSave = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2000);
  };

  return (
    <div className={`p-6 min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className={`p-6 rounded-lg shadow space-y-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
        {/* Theme Selection */}
        <div>
          <label className="block font-semibold mb-2">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className={`border p-2 rounded w-full ${theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "bg-white text-black"}`}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>

        {/* Notifications */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
          <label>Enable Notifications</label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>

        {showAlert && (
          <div className="mt-4 text-green-600 font-semibold">
            Settings saved successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;