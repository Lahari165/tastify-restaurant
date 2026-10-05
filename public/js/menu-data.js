/**
 * Tastify Arabian Mandi & Restaurant
 * Menu Data Structure
 * 
 * Restaurant owners can easily add, edit, or remove menu items here.
 * Supported fields per item:
 * - id: unique string
 * - name: string (Item Name)
 * - nameTelugu: string (transliteration / Telugu text)
 * - category: 'mandi' | 'starters' | 'main' | 'desserts' | 'beverages'
 * - isVeg: boolean (false = Non-Veg, true = Veg)
 * - isPopular: boolean
 * - isSignature: boolean
 * - priceDisplay: string ("Ask for today's menu" or "₹___")
 * - pricePerPerson: string ("₹200–₹400" average)
 * - portion: string ("Single / Double / Family Platter")
 * - description: string
 * - image: string (path to image)
 * - tags: array of strings
 */

const MENU_CATEGORIES = [
  { id: "all", label: "All Items", icon: "sparkle" },
  { id: "mandi", label: "Signature Mandi", icon: "flame" },
  { id: "starters", label: "Starters", icon: "plate" },
  { id: "main", label: "Main Course", icon: "curry" },
  { id: "desserts", label: "Desserts", icon: "dessert" },
  { id: "beverages", label: "Beverages", icon: "drink" }
];

const MENU_ITEMS = [
  {
    id: "chicken-mandi",
    name: "Chicken Mandi",
    nameTelugu: "చికెన్ మంది",
    category: "mandi",
    isVeg: false,
    isPopular: true,
    isSignature: true,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹220 – ₹380",
    portion: "Single / Double / Full Platter",
    description: "The crown jewel of Tastify. Slow-steamed spiced basmati rice infused with whole Arabian aromatics, crowned with tender roasted chicken, fried cashews, raisins, and golden caramelized onions. Served with traditional spicy tomato salata and cool mint raita.",
    image: "assets/images/hero-mandi.jpg",
    tags: ["Signature", "Slow-Cooked", "Must Try"]
  },
  {
    id: "chicken-65-mandi",
    name: "Chicken 65 Mandi",
    nameTelugu: "చికెన్ 65 మంది",
    category: "mandi",
    isVeg: false,
    isPopular: true,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹240 – ₹390",
    portion: "Single / Double / Family Platter",
    description: "The bold fusion favorite! Crispy, punchy, deep-crimson Chicken 65 bites tossed with curry leaves and green chilies, served generously over a smoking bed of fragrant mandi basmati rice.",
    image: "assets/images/chicken-65-mandi.jpg",
    tags: ["Spicy Favorite", "Crispy", "Popular"]
  },
  {
    id: "fry-piece-mandi",
    name: "Fry Piece Mandi",
    nameTelugu: "ఫ్రై పీస్ మంది",
    category: "mandi",
    isVeg: false,
    isPopular: true,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹250 – ₹390",
    portion: "Single / Double / Family Platter",
    description: "Beloved Hyderabadi-style fry piece chicken — marinated in fiery ground spices and shallow-fried to crispy perfection, resting atop delicate Arabian long-grain rice with roasted nuts.",
    image: "assets/images/fry-piece-mandi.jpg",
    tags: ["Crowd Favorite", "Crispy Fry", "Rich Spice"]
  },
  {
    id: "extra-rice",
    name: "Extra Mandi Rice",
    nameTelugu: "ఎక్స్‌ట్రా మంది రైస్",
    category: "mandi",
    isVeg: true,
    isPopular: false,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹100 – ₹150",
    portion: "Per Portion",
    description: "Extra serving of our signature slow-simmered, saffron-infused long-grain Mandi rice topped with crunchy caramelized onions, almonds, and raisins.",
    image: "assets/images/extra-rice.jpg",
    tags: ["Aromatic", "Side", "Mandi Basmati"]
  },
  {
    id: "chicken-majestic",
    name: "Chicken Majestic",
    nameTelugu: "చికెన్ మెజెస్టిక్",
    category: "starters",
    isVeg: false,
    isPopular: true,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹220 – ₹280",
    portion: "Appetizer Plate",
    description: "Tender boneless chicken strips stir-fried in a silky spiced yogurt emulsion with freshly crushed garlic, fragrant mint leaves, green chilies, and tempered curry leaves.",
    image: "assets/images/chicken-majestic.jpg",
    tags: ["Starter", "Hyderabadi Classic", "Zesty"]
  },
  {
    id: "chicken-65",
    name: "Chicken 65",
    nameTelugu: "చికెన్ 65 (స్టార్టర్)",
    category: "starters",
    isVeg: false,
    isPopular: true,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹200 – ₹260",
    portion: "Appetizer Plate",
    description: "The timeless South Indian starter with crisp bite, marinated in traditional spices, ginger-garlic paste, red chili, and fried to golden perfection with lemon wedges.",
    image: "assets/images/chicken-65-mandi.jpg",
    tags: ["Crispy", "Spicy", "Classic"]
  },
  {
    id: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    nameTelugu: "పన్నీర్ బటర్ మసాలా",
    category: "main",
    isVeg: true,
    isPopular: true,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹220 – ₹270",
    portion: "Curry Bowl (Serves 2)",
    description: "Melt-in-your-mouth cottage cheese cubes simmered gently in a velvety, buttery tomato-cashew makhani gravy, finished with fresh dairy cream and dried fenugreek leaves.",
    image: "assets/images/paneer-butter-masala.jpg",
    tags: ["Vegetarian", "Rich Gravy", "Creamy"]
  },
  {
    id: "belgium-shake",
    name: "Belgium Shake",
    nameTelugu: "బెల్జియం షేక్",
    category: "beverages",
    isVeg: true,
    isPopular: true,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹140 – ₹190",
    portion: "Tall Chilled Glass",
    description: "Thick, indulgent premium milkshake crafted with Belgian dark cocoa, artisanal chocolate ganache swirls, topped with whipped cream and crisp chocolate curls.",
    image: "assets/images/belgium-shake.jpg",
    tags: ["Beverage", "Decadent", "Chilled"]
  },
  {
    id: "chocolate-fudge",
    name: "Chocolate Fudge",
    nameTelugu: "చాక్లెట్ ఫడ్జ్",
    category: "desserts",
    isVeg: true,
    isPopular: true,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹150 – ₹200",
    portion: "Sizzling Platter",
    description: "Warm, gooey dark chocolate brownie served with a velvety scoop of vanilla bean ice cream, smothered in steaming molten fudge sauce and roasted walnuts.",
    image: "assets/images/chocolate-fudge.jpg",
    tags: ["Dessert", "Hot & Cold", "Sweet Sensation"]
  },
  {
    id: "ice-cream-sundaes",
    name: "Ice Cream Sundaes",
    nameTelugu: "ఐస్ క్రీమ్ సండేస్",
    category: "desserts",
    isVeg: true,
    isPopular: false,
    isSignature: false,
    priceDisplay: "Ask for today's menu",
    priceRange: "₹130 – ₹180",
    portion: "Crystal Sundae Glass",
    description: "Classic multi-scoop dessert served in a crystal coupe, layered with handcrafted syrups, crushed roasted nuts, fresh fruit coulis, and a crunchy wafer crisp.",
    image: "assets/images/ice-cream-sundae.jpg",
    tags: ["Refreshing", "Sweet", "Family Treat"]
  }
];

// Customer reviews directly reflecting the provided customer feedback
const CUSTOMER_REVIEWS = [
  {
    id: 1,
    name: "Syed Rehan & Group",
    role: "Regular Mandi Enthusiast",
    rating: 5,
    text: "Best place to have fun with friends and family. Tasty food and a good environment. The Chicken Mandi platter portion is generous and perfect for group sharing.",
    dish: "Chicken Mandi",
    date: "Recent Visit"
  },
  {
    id: 2,
    name: "Karthik Reddy",
    role: "Maisammaguda Food Explorer",
    rating: 5,
    text: "The meat is cooked with heat and smoke, creating a flavorful and juicy dish. You can really taste the authenticity in their slow dum process. Worth every rupee!",
    dish: "Signature Mandi",
    date: "Verified Diner"
  },
  {
    id: 3,
    name: "Mohammed Farhan",
    role: "Local Guide",
    rating: 5,
    text: "Fry piece mandi is so good here. The crisp on the chicken pieces combined with the aromatic basmati rice and tomato salata is unbeatable in this area.",
    dish: "Fry Piece Mandi",
    date: "Verified Diner"
  },
  {
    id: 4,
    name: "Ananya Sharma",
    role: "Student, Mallareddy Campus",
    rating: 4.5,
    text: "Super pocket-friendly (just ₹200–₹400 per person) for such rich Arabian vibes! We celebrated our friend's birthday here, and the ambience was warm and vibrant.",
    dish: "Chicken 65 Mandi & Belgium Shake",
    date: "Verified Diner"
  }
];

// Export to window
window.MENU_CATEGORIES = MENU_CATEGORIES;
window.MENU_ITEMS = MENU_ITEMS;
window.CUSTOMER_REVIEWS = CUSTOMER_REVIEWS;
