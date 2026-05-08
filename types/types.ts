import {
  FaHotel, FaUtensils, FaPlane, FaCompass, FaTrain, FaBus, FaTaxi, FaCamera,
  FaMusic, FaFilm, FaShoppingCart, FaDumbbell, FaHiking, FaSwimmer, FaSkiing,
  FaChurch, FaMonument, FaUmbrellaBeach, FaBiking, FaWalking, FaConciergeBell,
  FaWineGlassAlt, FaCoffee, FaIceCream, FaGamepad, FaTheaterMasks, FaShoppingBag,
  FaSpa, FaYinYang, FaRunning, FaHome, FaTree, FaAnchor, FaCar, FaHelicopter,
} from "react-icons/fa"

export default interface Trip {
    id: string;
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
    status: string;
    cover_url: string;
}

export interface ActivityType {
  value: string
  label: string
  icon: React.ElementType
  category: string
}

export const ACTIVITY_TYPES: ActivityType[] = [
  // Accommodation
  { value: 'hotel', label: 'Hotel', icon: FaHotel, category: 'Accommodation' },
  { value: 'hostel', label: 'Hostel', icon: FaHotel, category: 'Accommodation' },
  { value: 'airbnb', label: 'Airbnb', icon: FaHome, category: 'Accommodation' },
  { value: 'resort', label: 'Resort', icon: FaUmbrellaBeach, category: 'Accommodation' },
  { value: 'cottage', label: 'Cottage', icon: FaHome, category: 'Accommodation' },
  { value: 'motel', label: 'Motel', icon: FaHotel, category: 'Accommodation' },

  // Dining
  { value: 'restaurant', label: 'Restaurant', icon: FaUtensils, category: 'Dining' },
  { value: 'cafe', label: 'Café', icon: FaCoffee, category: 'Dining' },
  { value: 'bar', label: 'Bar', icon: FaWineGlassAlt, category: 'Dining' },
  { value: 'bakery', label: 'Bakery', icon: FaIceCream, category: 'Dining' },

  // Transport
  { value: 'flight', label: 'Flight', icon: FaPlane, category: 'Transport' },
  { value: 'train', label: 'Train', icon: FaTrain, category: 'Transport' },
  { value: 'bus', label: 'Bus', icon: FaBus, category: 'Transport' },
  { value: 'taxi', label: 'Taxi', icon: FaTaxi, category: 'Transport' },
  { value: 'ferry', label: 'Ferry', icon: FaAnchor, category: 'Transport' },
  { value: 'metro', label: 'Metro', icon: FaTrain, category: 'Transport' },
  { value: 'bike', label: 'Bike', icon: FaBiking, category: 'Transport' },
  { value: 'helicopter', label: 'Helicopter', icon: FaHelicopter, category: 'Transport' },

  // Sightseeing
  { value: 'activity', label: 'Activity', icon: FaCompass, category: 'Sightseeing' },
  { value: 'museum', label: 'Museum', icon: FaCamera, category: 'Sightseeing' },
  { value: 'landmark', label: 'Landmark', icon: FaMonument, category: 'Sightseeing' },
  { value: 'park', label: 'Park', icon: FaTree, category: 'Sightseeing' },
  { value: 'beach', label: 'Beach', icon: FaUmbrellaBeach, category: 'Sightseeing' },
  { value: 'viewpoint', label: 'Viewpoint', icon: FaCamera, category: 'Sightseeing' },
  { value: 'monument', label: 'Monument', icon: FaMonument, category: 'Sightseeing' },

  // Entertainment
  { value: 'cinema', label: 'Cinema', icon: FaFilm, category: 'Entertainment' },
  { value: 'concert', label: 'Concert', icon: FaMusic, category: 'Entertainment' },
  { value: 'theater', label: 'Theater', icon: FaTheaterMasks, category: 'Entertainment' },
  { value: 'nightclub', label: 'Nightclub', icon: FaMusic, category: 'Entertainment' },
  { value: 'show', label: 'Show', icon: FaTheaterMasks, category: 'Entertainment' },
  { value: 'arcade', label: 'Arcade', icon: FaGamepad, category: 'Entertainment' },

  // Shopping
  { value: 'mall', label: 'Mall', icon: FaShoppingBag, category: 'Shopping' },
  { value: 'market', label: 'Market', icon: FaShoppingCart, category: 'Shopping' },
  { value: 'boutique', label: 'Boutique', icon: FaShoppingBag, category: 'Shopping' },

  // Adventure & Sports
  { value: 'hiking', label: 'Hiking', icon: FaHiking, category: 'Adventure' },
  { value: 'climbing', label: 'Climbing', icon: FaHiking, category: 'Adventure' },
  { value: 'diving', label: 'Diving', icon: FaSwimmer, category: 'Adventure' },
  { value: 'skiing', label: 'Skiing', icon: FaSkiing, category: 'Adventure' },
  { value: 'surfing', label: 'Surfing', icon: FaSwimmer, category: 'Adventure' },
  { value: 'swimming', label: 'Swimming', icon: FaSwimmer, category: 'Adventure' },
  { value: 'gym', label: 'Gym', icon: FaDumbbell, category: 'Adventure' },

  // Wellness
  { value: 'spa', label: 'Spa', icon: FaSpa, category: 'Wellness' },
  { value: 'yoga', label: 'Yoga', icon: FaYinYang, category: 'Wellness' },
]