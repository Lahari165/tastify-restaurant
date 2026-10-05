/**
 * Tastify Arabian Mandi & Restaurant
 * Configuration & Restaurant Information
 * 
 * Restaurant owners can easily update phone numbers, ordering URLs,
 * timing, and location details in this single file.
 */

const RESTAURANT_CONFIG = {
  name: "Tastify",
  nameTelugu: "టేస్టిఫై - అరేబియన్ మంది & రెస్టారెంట్",
  tagline: "Authentic Arabian Mandi & Fine Dining",
  subTagline: "Where Every Mandi Tells a Story • Maisammaguda, Hyderabad",
  
  // PRIMARY CONFIGURABLE ORDERING URL:
  // If you partner with an online delivery platform (Zomato/Swiggy/Own Web Store),
  // simply insert the URL below. Leave empty ("") to default to direct WhatsApp & Phone ordering.
  ORDER_URL: "", 

  // Contact details
  phoneDisplay: "099668 88060",
  phoneRaw: "09966888060",
  phoneTel: "tel:09966888060",
  whatsappNumber: "919966888060", // international format for wa.me link
  whatsappMessage: "Hello Tastify! I would like to order delicious Mandi / reserve a table.",

  // Location details
  address: "HF63+X22, Maisammaguda, Bhadurpalle, Hyderabad, Telangana 500100",
  shortAddress: "Maisammaguda, Bhadurpalle, Hyderabad 500100",
  plusCode: "HF63+X22 Hyderabad",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tastify+Arabian+Mandi+Maisammaguda+Hyderabad+500100",
  mapsEmbedQuery: "Tastify+Arabian+Mandi+Maisammaguda+Hyderabad",

  // Pricing & Metrics
  priceRange: "₹200–₹400",
  rating: 4.3,
  reviewCount: 872,
  operatingHours: "12:00 PM – 11:30 PM (Mon – Sun)",

  // Services offered
  services: [
    { title: "Dine-in", desc: "Authentic Arabian Majlis & table seating", icon: "dine-in" },
    { title: "Drive-through", desc: "Quick pickup on your way home", icon: "drive-through" },
    { title: "No-contact Delivery", desc: "Hot Mandi delivered safely to your doorstep", icon: "delivery" },
    { title: "Online Ordering", desc: "Instant phone & WhatsApp ordering", icon: "order" }
  ]
};

// Export to window for global access
window.RESTAURANT_CONFIG = RESTAURANT_CONFIG;
