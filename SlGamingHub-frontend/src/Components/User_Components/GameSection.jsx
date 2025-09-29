import { useEffect, useState } from "react";
// import axios from "axios";
import { useNavigate } from "react-router-dom";
import { mockGameData } from "../../utils/mockData";
import { isLoggedIn } from "../../utils/authUtils";

const GameSection = () => {
  
  const [gameList, setGameList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const navigate = useNavigate();

  // Use only mock data for games
  const fetchGames = () => {
    setLoading(true);
    setGameList(mockGameData);
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
  fetchGames();
  }, []);


  function handleTopUp(gameId) {
    console.log("TopUp requested for game ID:", gameId);
    
    // Direct to specialized top-up pages based on game ID
    switch(gameId) {
      case "68adf809384ec2353d40f565":
        console.log("Navigating to Free Fire SG");
        navigate("/topup/freefire-sg");
        break;
      case "68adfc1b384ec2353d40f57c":
        console.log("Navigating to Free Fire Indonesia");
        navigate("/topup/freefire-indonesia");
        break;
      case "68adfc5a384ec2353d40f57f":
        console.log("Navigating to PUBG Mobile");
        navigate("/topup/pubg-mobile");
        break;
      default:
        // Fallback to the generic top-up page
        console.log("Navigating to generic top-up page");
        navigate(`/package/game/${gameId}`);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {loading ? (
        // Loading spinner
        <div className="col-span-full flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : gameList && gameList.length > 0 ? (
        // Game cards
        gameList.map((game, index) => (
          <div 
            key={index}
            className="bg-white rounded-2xl shadow-md overflow-hidden transform hover:scale-105 transition duration-300"
          >
            <img
              src={game.image}
              alt={game.gamename || "Game"}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/src/assets/logo.jpeg"; // Fallback image
              }}
            />
            <div className="p-4 flex flex-col items-center">
              <h1 className="text-xl font-semibold mb-3 text-gray-800">
                {game.gamename}
              </h1>
              <button 
                onClick={() => handleTopUp(game._id)} 
                className="px-5 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-200 transition"
              >
                Top Up
              </button>
            </div>
          </div>
        ))
      ) : (
        // No games available message
        <div className="col-span-full text-center py-10">
          <h2 className="text-xl font-semibold text-gray-700">No games available at the moment</h2>
          <p className="text-gray-500 mt-2">Please check back later for new games</p>
        </div>
      )}
    </div>
  );
};

export default GameSection;
