export const productCategories = [
  'disposable',
  'pod-system', 
  'mod',
  'e-liquid',
  'accessories'
] as const

export const productData = [
  {
    name: "RANDM TORNADO Strawberry",
    description: "High-quality disposable vape with premium flavor and long-lasting battery.",
    price: 7,
    images: ["/images/products/1.jpg"],
    category: "disposable",
    stock: 5000,
    specifications: {
      "Battery": "850mAh",
      "Puffs": "2000+",
      "Nicotine": "5%",
      "Flavor": "Mixed Berry"
    },
    tags: ["premium", "disposable", "berry"],
    rating: { average: 4.5, count: 23 }
  },
  {
    name: "RANDM TORNADO Blueberry on ice", 
    description: "Sleek pod system with refillable cartridges and adjustable airflow.",
    price: 7,
    images: ["/images/products/2.jpg"],
    category: "pod-system",
    stock: 3200,
    specifications: {
      "Battery": "1200mAh",
      "Capacity": "2ml",
      "Resistance": "1.2Ω",
      "Wattage": "15W"
    },
    tags: ["pod", "refillable", "premium"],
    rating: { average: 4.7, count: 18 }
  },
  {
    name: "RANDM TORNADO Skittles",
    description: "Professional-grade mod with temperature control and LED display.",
    price: 8,
    images: ["/images/products/3.jpg"],
    category: "mod",
    stock: 1500,
    specifications: {
      "Battery": "Dual 18650",
      "Wattage": "200W Max",
      "Display": "OLED",
      "Material": "Zinc Alloy"
    },
    tags: ["mod", "advanced", "temperature-control"],
    rating: { average: 4.8, count: 12 }
  },
  {
    name: " RANDM TORNADO Black ice",
    description: "Premium e-liquid with natural fruit extracts and smooth throat hit.",
    price: 8,
    images: ["/images/products/4.jpg"],
    category: "e-liquid",
    stock: 7500,
    specifications: {
      "Volume": "30ml",
      "VG/PG": "70/30",
      "Nicotine": "3mg",
      "Flavor": "Tropical Fruit"
    },
    tags: ["e-liquid", "fruit", "premium"],
    rating: { average: 4.3, count: 31 }
  },
  {
    name: "TFVAPORDI Weeding Cake",
    description: "Complete starter kit with everything needed to begin vaping.",
    price: 8,
    images: ["/images/products/5.jpg"],
    category: "accessories",
    stock: 2800,
    specifications: {
      "Kit Contents": "Device, Charger, Manual",
      "Battery": "1000mAh",
      "Coils": "2x Included",
      "Warranty": "6 Months"
    },
    tags: ["starter-kit", "complete", "beginner"],
    rating: { average: 4.6, count: 25 }
  },
  {
    name: " TFVAPORDI Runtz",
    description: "High-quality glass tank with leak-proof design and easy refill.",
    price: 8,
    images: ["/images/products/6.jpg"],
    category: "accessories",
    stock: 4000,
    specifications: {
      "Capacity": "5ml",
      "Material": "Pyrex Glass",
      "Threading": "510",
      "Airflow": "Adjustable"
    },
    tags: ["tank", "glass", "leak-proof"],
    rating: { average: 4.4, count: 19 }
  },
  {
    name: "TFVAPORDI Gelato 33",
    description: "Ultra-portable disposable vape perfect for on-the-go use.",
    price: 8,
    images: ["/images/products/7.jpg"],
    category: "disposable",
    stock: 6000,
    specifications: {
      "Battery": "600mAh",
      "Puffs": "1500+",
      "Nicotine": "5%",
      "Size": "Pocket-sized"
    },
    tags: ["compact", "portable", "disposable"],
    rating: { average: 4.2, count: 28 }
  },
  {
    name: "FUMOT",
    description: "Innovative pod system with fast charging and long battery life.",
    price: 5,
    images: ["/images/products/8.jpg"],
    category: "pod-system",
    stock: 3500,
    specifications: {
      "Battery": "1500mAh",
      "Charging": "USB-C Fast Charge",
      "Pod Capacity": "3ml",
      "Coil Life": "7-10 days"
    },
    tags: ["rechargeable", "fast-charge", "long-life"],
    rating: { average: 4.7, count: 22 }
  },
  {
    name: "FUMOT Watermelon Ice",
    description: "High-end box mod with advanced chipset and safety features.",
    price: 5,
    images: ["/images/products/9.jpg"],
    category: "mod",
    stock: 1200,
    specifications: {
      "Chipset": "Advanced DNA",
      "Wattage": "250W Max",
      "Features": "TC, Bypass, Replay",
      "Construction": "watermelon"
    },
    tags: ["professional", "high-end", "advanced"],
    rating: { average: 4.9, count: 8 }
  },
  {
    name: "FUMOT Blueberry BubbleGum",
    description: "Decadent dessert-flavored e-liquid with creamy vanilla notes.",
    price: 5,
    images: ["/images/products/10.jpg"],
    category: "e-liquid",
    stock: 4500,
    specifications: {
      "Volume": "60ml",
      "VG/PG": "80/20",
      "Nicotine": "6mg",
      "Profile": "Dessert/Cream"
    },
    tags: ["dessert", "sweet", "cream"],
    rating: { average: 4.5, count: 33 }
  },
  {
    name: " FUMOT Bluesour Rapesberry",
    description: "Reliable all-day vape with consistent performance and flavor.",
    price: 5,
    images: ["/images/products/11.jpg"],
    category: "disposable",
    stock: 5500,
    specifications: {
      "Battery": "1100mAh",
      "Puffs": "2500+",
      "Nicotine": "3%",
      "Flavor Consistency": "Excellent"
    },
    tags: ["all-day", "reliable", "consistent"],
    rating: { average: 4.6, count: 27 }
  },
  {
    name: " CROWN BAR Gum Mint",
    description: "Elegant pod system designed for style and performance.",
    price: 8,
    images: ["/images/products/12.jpg"],
    category: "pod-system",
    stock: 3000,
    specifications: {
      "Design": "Sleek Aluminum",
      "Battery": "1300mAh",
      "Pod Capacity": "2.5ml",
      "Draw": "MTL/DTL Compatible"
    },
    tags: ["sleek", "elegant", "versatile"],
    rating: { average: 4.4, count: 21 }
  },
  {
    name: " CROWN BAR Berry Blue",
    description: "High-powered mod setup for cloud chasing enthusiasts.",
    price: 8,
    images: ["/images/products/13.jpg"],
    category: "mod",
    stock: 1800,
    specifications: {
      "Power": "220W Dual Battery",
      "Tank": "Sub-ohm Compatible",
      "Coils": "0.15Ω - 3.0Ω",
      "Features": "Variable Wattage"
    },
    tags: ["powerful", "cloud-chasing", "high-wattage"],
    rating: { average: 4.7, count: 15 }
  },
  {
    name: "CROWN BAR Blue ice Lemonade",
    description: "Cool and refreshing Lemonade e-liquid with natural mint extracts.",
    price: 8,
    images: ["/images/products/14.jpg"],
    category: "e-liquid",
    stock: 1500,
    specifications: {
      "Volume": "30ml",
      "VG/PG": "60/40",
      "Nicotine": "12mg",
      "Profile": "Menthol/Mint"
    },
    tags: ["lemonade", "mint", "refreshing"],
    rating: { average: 4.3, count: 29 }
  },
  {
    name: "ELFBAR Blue Razz ice",
    description: "Protective carrying case for vape devices and accessories.",
    price: 6,
    images: ["/images/products/15.jpg"],
    category: "accessories",
    stock: 2000,
    specifications: {
      "Material": "EVA Hard Case",
      "Dimensions": "8x4x2 inches",
      "Compartments": "Multiple organized",
      "Protection": "Shock resistant"
    },
    tags: ["case", "travel", "protection"],
    rating: { average: 4.2, count: 24 }
  },
  {
    name: " ELFBAR Miami Hint",
    description: "Extended-use disposable vape with premium coil technology.",
    price: 6,
    images: ["/images/products/16.jpg"],
    category: "disposable",
    stock: 1000,
    specifications: {
      "Battery": "1200mAh",
      "Puffs": "3000+",
      "Coil": "Mesh Technology",
      "Nicotine": "5%"
    },
    tags: ["long-lasting", "mesh-coil", "premium"],
    rating: { average: 4.8, count: 20 }
  },
  {
    name: "PACKMAN",
    description: "Intelligent pod system with app connectivity and usage tracking.",
    price: 7,
    images: ["/images/products/17.jpg"],
    category: "pod-system",
    stock: 1000,
    specifications: {
      "Connectivity": "Bluetooth 5.0",
      "App": "iOS/Android Compatible",
      "Battery": "1800mAh",
      "Features": "Usage Analytics"
    },
    tags: ["smart", "bluetooth", "app-connected"],
    rating: { average: 4.6, count: 16 }
  },
  {
    name: "FRYD Blueberry",
    description: "Handcrafted mod with unique design and premium materials.",
    price: 10,
    images: ["/images/products/18.jpg"],
    category: "mod",
    stock: 1000,
    specifications: {
      "Material": "Stabilized Wood",
      "Craftsmanship": "Handmade",
      "Power": "Single 21700",
      "Finish": "Lacquered"
    },
    tags: ["blueberry", "handcrafted", "luxury"],
    rating: { average: 4.9, count: 6 }
  },
  {
    name: "FRYD Watermelon",
    description: "Authentic watermelon flavor with smooth and rich profile.",
    price: 10,
    images: ["/images/products/19.jpg"],
    category: "e-liquid",
    stock: 1000,
    specifications: {
      "Volume": "50ml",
      "VG/PG": "70/30",
      "Nicotine": "18mg",
      "Profile": "Classic Tobacco"
    },
    tags: ["watermelon", "fruit", "authentic"],
    rating: { average: 4.1, count: 26 }
  },
  {
    name: " FRYD Tropical runtz punch",
    description: "High-quality replacement coils for enhanced flavor and vapor.",
    price: 10,
    images: ["/images/products/20.jpg"],
    category: "accessories",
    stock: 1000,
    specifications: {
      "Pack Size": "5 Coils",
      "Resistance": "0.4Ω",
      "Material": "Kanthal A1",
      "Compatibility": "Universal 510"
    },
    tags: ["coils", "replacement", "kanthal"],
    rating: { average: 4.5, count: 42 }
  },
  {
    name: "Falcon-X Blue Razz Iced",
    description: "Smallest disposable vape with maximum portability and discretion.",
    price: 20,
    images: ["/images/products/21.jpg"],
    category: "disposable",
    stock: 1000,
    specifications: {
      "Size": "Ultra Compact",
      "Battery": "400mAh",
      "Puffs": "800+",
      "Weight": "18g"
    },
    tags: ["ultra-compact", "discrete", "lightweight"],
    rating: { average: 4.0, count: 35 }
  },
  {
    name: "Falcon JNR",
    description: "Innovative pod system with magnetic connection and easy refill.",
    price: 20,
    images: ["/images/products/22.jpg"],
    category: "pod-system",
    stock: 1000,
    specifications: {
      "Connection": "Magnetic",
      "Battery": "1100mAh",
      "Fill": "Side-fill Design",
      "Pods": "2ml Capacity"
    },
    tags: ["magnetic", "easy-fill", "innovative"],
    rating: { average: 4.4, count: 19 }
  },
  {
    name: "MUHA MEDS Exclusive",
    description: "Professional competition-grade med for serious vapers.",
    price: 20,
    images: ["/images/products/23.jpg"],
    category: "mod",
    stock: 1000,
    specifications: {
      "Type": "Mechanical Mod",
      "Material": "Pure Copper",
      "Thread": "Hybrid 510",
      "Grade": "Competition"
    },
    tags: ["competition", "mechanical", "professional"],
    rating: { average: 4.8, count: 9 }
  },
  {
    name: "MUHA MEDS Blue iced",
    description: "Exotic Hybrid.",
    price: 20,
    images: ["/images/products/24.jpg"],
    category: "e-liquid",
    stock: 1000,
    specifications: {
      "Volume": "60ml",
      "VG/PG": "75/25",
      "Nicotine": "3mg",
      "Profile": "Tropical Fruits"
    },
    tags: ["tropical", "exotic", "fruit-blend"],
    rating: { average: 4.6, count: 30 }
  },
  {
    name: "MUHA MEDS",
    description: "melted diamond All-In-One.",
    price: 20,
    images: ["/images/products/25.jpg"],
    category: "accessories",
    stock: 1000,
    specifications: {
      "Tools": "15-piece Set",
      "Material": "Stainless Steel",
      "Case": "Organized Storage",
      "Use": "Maintenance & Building"
    },
    tags: ["tools", "maintenance", "coil-building"],
    rating: { average: 4.7, count: 17 }
  }
]