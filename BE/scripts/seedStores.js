import axios from 'axios';
import db from '../config/db.js';
import { ALLOWED_AREAS, ALLOWED_CUISINES } from '../config/constants.js';
import dotenv from 'dotenv';
dotenv.config();

// SEARCH PARAMETERS
const SEARCH_QUERY = 'food Singapore';
const LIMIT = 20;

// Extract MULTIPLE cuisines from OSM data (returns ARRAY for JSON)
function extractCuisines(rawType, placeName = '') {
  const matchedCuisines = new Set();
  const lowerType = rawType.toLowerCase();
  const lowerName = placeName.toLowerCase();
  const searchText = `${lowerType} ${lowerName}`;
  
  const keywordMappings = {
    'burger': ['Western', 'Fast Food'],
    'pizza': ['Western', 'Fast Food'],
    'pasta': ['Western', 'Fast Food'],
    'fries': ['Western', 'Fast Food'],
    'steak': ['Western'],
    'grill': ['Western'],
    'western': ['Western'],
    'fast food': ['Fast Food'],
    'fast-food': ['Fast Food'],
    'fastfood': ['Fast Food'],
    'seafood': ['Seafood'],
    'fish': ['Seafood'],
    'crab': ['Seafood'],
    'prawn': ['Seafood'],
    'chinese': ['Chinese'],
    'dim sum': ['Chinese'],
    'wok': ['Chinese'],
    'stir fry': ['Chinese'],
    'indian': ['Indian'],
    'curry': ['Indian'],
    'tandoori': ['Indian'],
    'prata': ['Indian'],
    'biryani': ['Indian'],
    'local': ['Local'],
    'singaporean': ['Local'],
    'nasi': ['Local'],
    'mee': ['Local'],
    'chicken rice': ['Local'],
    'laksa': ['Local'],
    'hokkien': ['Local'],
    'char kway teow': ['Local'],
    'muslim': ['Muslim', 'Halal'],
    'halal': ['Halal', 'Muslim'],
    'mamak': ['Muslim', 'Indian'],
    'veg': ['Vegetarian'],
    'vegetarian': ['Vegetarian'],
    'vegan': ['Vegetarian'],
    'meat-free': ['Vegetarian'], 
    'korean': ['Korean'],
    'kimchi': ['Korean'],
    'bibimbap': ['Korean'],
    'japanese': ['Japanese'],
    'sushi': ['Japanese'],
    'ramen': ['Japanese'],
    'teriyaki': ['Japanese'],
    'vietnamese': ['Vietnamese'],
    'pho': ['Vietnamese'],
    'banh mi': ['Vietnamese'], 
    'mediterranean': ['Mediterranean'],
    'greek': ['Mediterranean'],
    'hummus': ['Mediterranean'],
    

  };
  
  for (const [keyword, cuisineArray] of Object.entries(keywordMappings)) {
    if (searchText.includes(keyword)) {
      for (const cuisine of cuisineArray) {
        if (ALLOWED_CUISINES.includes(cuisine)) {
          matchedCuisines.add(cuisine);
        }
      }
    }
  }
  
  for (const cuisine of ALLOWED_CUISINES) {
    const cuisineLower = cuisine.toLowerCase();
    if (searchText.includes(cuisineLower)) {
      matchedCuisines.add(cuisine);
    }
  }
  
  if (matchedCuisines.size === 0) {
    if (searchText.includes('nasi') || searchText.includes('mee') || searchText.includes('chicken rice')) {
      matchedCuisines.add('Local');
    } else if (searchText.includes('curry') || searchText.includes('tandoori') || searchText.includes('prata')) {
      matchedCuisines.add('Indian');
    } else if (searchText.includes('kfc') || searchText.includes('mcdonald') || searchText.includes('burger king')) {
      matchedCuisines.add('Western');
      matchedCuisines.add('Fast Food');
    }
  }
  
  // ✅ Return as ARRAY (not comma-separated string)
  return Array.from(matchedCuisines);
}

async function seedFromOpenStreetMap() {
  try {
    console.log(`🔍 Fetching "${SEARCH_QUERY}" from OpenStreetMap...`);
    
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: SEARCH_QUERY,
        format: 'json',
        addressdetails: 1,
        limit: LIMIT,
        countrycodes: 'sg'
      },
      headers: { 'User-Agent': 'EatWhereApp/1.0' }
    });

    if (!response.data || response.data.length === 0) {
      console.log("⚠️ OSM returned nothing. Try a different SEARCH_QUERY.");
      return;
    }
    
    const places = response.data;
    console.log(`📦 Received ${places.length} raw results from OSM\n`);

    let addedCount = 0;
    let skippedCount = 0;
    const seenNames = new Set();
    const cuisineStats = new Map();
    const areaStats = new Map();
    let multiCuisineCount = 0;

    for (const place of places) {
      const addressString = place.display_name;
      
      const placeName = place.display_name.split(',')[0];
      
      // ✅ CHECK 1: Skip duplicates within same batch
      if (seenNames.has(placeName)) {
        console.log(`⏭️ Skipped (same batch duplicate): ${placeName}`);
        skippedCount++;
        continue;
      }
      seenNames.add(placeName);

      // ✅ CHECK 2: Skip if already exists in database (from previous runs)
      const [existing] = await db.execute(
        'SELECT id FROM stores WHERE name = ?',
        [placeName]
      );
      
      if (existing.length > 0) {
        console.log(`⏭️ Skipped (already in database): ${placeName}`);
        skippedCount++;
        continue;
      }

      const matchedArea = ALLOWED_AREAS.find(area => 
        addressString.toLowerCase().includes(area.toLowerCase())
      ) || 'Singapore';
      
      areaStats.set(matchedArea, (areaStats.get(matchedArea) || 0) + 1);

      let rawType = place.type ? place.type.replace(/_/g, ' ').toLowerCase() : '';
      if (place.class) rawType += ` ${place.class.toLowerCase()}`;
      
      const matchedCuisinesArray = extractCuisines(rawType, placeName);
      
      // ✅ Convert to JSON string for MySQL JSON column
      const cuisineJSON = JSON.stringify(matchedCuisinesArray);
      
      const cuisineCount = matchedCuisinesArray.length;
      if (cuisineCount > 1) {
        multiCuisineCount++;
      }
      
      for (const cuisine of matchedCuisinesArray) {
        cuisineStats.set(cuisine, (cuisineStats.get(cuisine) || 0) + 1);
      }

      const storeData = {
        name: placeName,
        country: 'Singapore',
        area: matchedArea,
        cuisine: cuisineJSON,  // ✅ Now JSON format: ["Chinese", "Seafood"]
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        rating: null,
        image_path: null,
        map_link: `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=16/${place.lat}/${place.lon}`,
        operating: true,
        description: 'Imported via EatWhere Logic.',
        opening_hours: null,  // ✅ Can be JSON object later
        owner_id: null
      };

      try {
        const sql = `
          INSERT INTO stores (
            name, country, area, cuisine, lat, lng, 
            rating, image_path, map_link, operating, 
            description, opening_hours, owner_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          storeData.name,
          storeData.country,
          storeData.area,
          storeData.cuisine,  // ✅ JSON string
          storeData.lat,
          storeData.lng,
          storeData.rating,
          storeData.image_path,
          storeData.map_link,
          storeData.operating,
          storeData.description,
          storeData.opening_hours,
          storeData.owner_id
        ];
        
        await db.execute(sql, values);
        addedCount++;
        
        let logMessage = `✅ Added: ${storeData.name}`;
        logMessage += ` | Area: ${matchedArea}`;
        logMessage += ` | Cuisine(s): ${matchedCuisinesArray.join(', ') || 'None'}`;
        
        if (cuisineCount > 1) {
          logMessage += ` ✨ (${cuisineCount} cuisines)`;
        }
        
        console.log(logMessage);
        
      } catch (dbError) {
        console.error(`❌ Failed to add ${storeData.name}:`, dbError.message);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully added: ${addedCount} stores`);
    console.log(`⏭️ Skipped: ${skippedCount} stores`);
    console.log(`📝 Total processed: ${places.length} places`);
    console.log(`🍽️ Stores with multiple cuisines: ${multiCuisineCount}\n`);
    
    console.log('📍 AREA BREAKDOWN:');
    for (const [area, count] of areaStats) {
      console.log(`   ${area}: ${count} stores`);
    }
    
    if (cuisineStats.size > 0) {
      console.log('\n CUISINE BREAKDOWN:');
      for (const [cuisine, count] of cuisineStats) {
        console.log(`   ${cuisine}: ${count} stores`);
      }
    }
    
    console.log('\n Seeding complete!');
    
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    if (err.response) {
      console.error('API Response status:', err.response.status);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedFromOpenStreetMap();
}

export { seedFromOpenStreetMap };