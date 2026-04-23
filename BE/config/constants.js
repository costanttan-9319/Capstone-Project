// ==================FOR AREAS NAME==================
export const ALLOWED_AREAS = [
    'Ang Mo Kio', 'Bedok', 'Bishan', 'Boon Lay', 'Bukit Batok', 
    'Bukit Merah', 'Bukit Panjang', 'Bukit Timah', 'Central Area', 'Changi', 
    'Changi Bay', 'Choa Chu Kang', 'Clementi', 'Downtown Core', 'Geylang', 
    'Hougang', 'Jurong East', 'Jurong West', 'Kallang', 'Lim Chu Kang', 
    'Mandai', 'Marine Parade', 'Museum', 'Newton', 'Novena', 
    'Orchard', 'Outram', 'Pasir Ris', 'Paya Lebar', 'Pioneer', 
    'Punggol', 'Queenstown', 'River Valley', 'Rochor', 'Seletar', 
    'Sembawang', 'Sengkang', 'Serangoon', 'Simpang', 'Singapore River', 
    'Sungei Kadut', 'Tampines', 'Tanglin', 'Tengah', 'Toa Payoh', 
    'Tuas', 'Western Islands', 'Western Water Catchment', 'Woodlands', 'Yishun'
];

//==================FOR CUISINE==================
export const ALLOWED_CUISINES = [
    'Local', 'Chinese', 'Muslim', 'Halal', 'Indian', 
    'Western', 'Fast Food', 'Seafood', 'Vegetarian',
    'Korean', 'Japanese', 'Vietnamese', 'Mediterranean'
];

// ============AREA CENTRAL COORDINATES (for default search starting points)==================
export const AREA_COORDINATES = {

    'Central Area': { lat: 1.2902, lng: 103.8519 },
    'Downtown Core': { lat: 1.2801, lng: 103.8509 },
    'Singapore River': { lat: 1.2900, lng: 103.8480 },
    'Museum': { lat: 1.2965, lng: 103.8475 },
    'Orchard': { lat: 1.3039, lng: 103.8317 },
    'Newton': { lat: 1.3120, lng: 103.8330 },
    'Novena': { lat: 1.3200, lng: 103.8430 },
    'River Valley': { lat: 1.2915, lng: 103.8280 },
    'Rochor': { lat: 1.3030, lng: 103.8530 },
    'Tanglin': { lat: 1.3080, lng: 103.8150 },
    'Outram': { lat: 1.2820, lng: 103.8400 },
    'Bedok': { lat: 1.3235, lng: 103.9305 },
    'Changi': { lat: 1.3550, lng: 103.9870 },
    'Changi Bay': { lat: 1.3660, lng: 104.0000 },
    'Pasir Ris': { lat: 1.3730, lng: 103.9490 },
    'Tampines': { lat: 1.3510, lng: 103.9420 },
    'Marine Parade': { lat: 1.3020, lng: 103.9060 },
    'Geylang': { lat: 1.3180, lng: 103.8920 },
    'Paya Lebar': { lat: 1.3350, lng: 103.8920 },
    'Ang Mo Kio': { lat: 1.3700, lng: 103.8480 },
    'Bishan': { lat: 1.3510, lng: 103.8490 },
    'Hougang': { lat: 1.3710, lng: 103.8920 },
    'Sengkang': { lat: 1.3910, lng: 103.8950 },
    'Punggol': { lat: 1.4040, lng: 103.9070 },
    'Seletar': { lat: 1.4100, lng: 103.8670 },
    'Sembawang': { lat: 1.4490, lng: 103.8190 },
    'Woodlands': { lat: 1.4360, lng: 103.7860 },
    'Yishun': { lat: 1.4290, lng: 103.8350 },
    'Mandai': { lat: 1.4170, lng: 103.7850 },
    'Simpang': { lat: 1.4400, lng: 103.8350 },
    'Boon Lay': { lat: 1.3380, lng: 103.7070 },
    'Bukit Batok': { lat: 1.3590, lng: 103.7490 },
    'Bukit Merah': { lat: 1.2780, lng: 103.8210 },
    'Bukit Panjang': { lat: 1.3780, lng: 103.7620 },
    'Bukit Timah': { lat: 1.3290, lng: 103.8020 },
    'Clementi': { lat: 1.3150, lng: 103.7650 },
    'Jurong East': { lat: 1.3320, lng: 103.7420 },
    'Jurong West': { lat: 1.3400, lng: 103.7070 },
    'Lim Chu Kang': { lat: 1.4320, lng: 103.7120 },
    'Pioneer': { lat: 1.3350, lng: 103.6980 },
    'Queenstown': { lat: 1.2950, lng: 103.8050 },
    'Sungei Kadut': { lat: 1.4100, lng: 103.7500 },
    'Tengah': { lat: 1.3750, lng: 103.7200 },
    'Tuas': { lat: 1.3110, lng: 103.6300 },
    'Western Islands': { lat: 1.2100, lng: 103.6500 },
    'Western Water Catchment': { lat: 1.3850, lng: 103.7000 },
    'Choa Chu Kang': { lat: 1.3850, lng: 103.7450 },
    'Kallang': { lat: 1.3100, lng: 103.8700 },
    'Serangoon': { lat: 1.3500, lng: 103.8730 },
    'Toa Payoh': { lat: 1.3350, lng: 103.8500 }
};

// ==================Helper function to get area coordinates==================
export const getAreaCoordinates = (areaName) => {
    return AREA_COORDINATES[areaName] || { lat: 1.3521, lng: 103.8198 }; // Default to Singapore's area centeral
};

//==================FOR PRICE RANGES=================
export const PRICE_OPTIONS = [
  '$1-10 /pax',
  '$10-30 /pax',
  '$30-50 /pax',
  '$50-80 /pax',
  '$80-120 /pax',
  '>$120 /pax'
];