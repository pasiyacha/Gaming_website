// Import all game banner images
import freeFireBanner from '../assets/Gamage Images/FreeFire.jpg';
import pubgBanner from '../assets/Gamage Images/PBG.png';
import bannerImage from '../assets/Banner/banner.jpg';

// Import card images for fallbacks
import defaultCard from '../assets/cards/1.png';
import pubgCard from '../assets/cards/14.png';

// Export an object with all game images for easy access
export const gameImages = {
  freeFire: freeFireBanner,
  pubg: pubgBanner,
  banner: bannerImage
};

// Card images
export const cardImages = {
  default: defaultCard,
  pubg: pubgCard
};

// Export individual images for direct imports
export { freeFireBanner, pubgBanner, bannerImage, defaultCard, pubgCard };
