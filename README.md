## Real-Time Food Discovery for the Community
Eatwhere is a full-stack discovery platform designed to bridge the gap between busy merchants (Hawkers, cafe, restaurants, etc) and food explorers. Unlike static map services, Eatwhere provides a "Live Status" engine that reflects the actual operational reality of small stalls in real-time.

## Core Objectives
Live Operational Certainty: Automated time-logic (e.g., "Drinks Only" during mid-day breaks) with manual Merchant overrides for "Sold Out" or "Temporary Closed" scenarios.

Trust-Based Discovery: One-click deep linking to Instagram and TikTok profiles so users can verify merchants via their latest social media updates.

Data Integrity: A hybrid data approach that merges filtered OpenStreetMap records with a manual JSON buffer to resolve incomplete API data.

## Tech Stack
Frontend: React + Vite (Running on Port 5173)

Backend: Node.js + Express (Running on Port 5000)

Database: MySQL (Running on Port 3306)

Authentication: JWT (JSON Web Tokens) for secure Merchant/Admin access.

Security: Bcryptjs password hashing.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/search-by-address?address=...` | Search stores near an address |
| GET | `/api/stores/search-by-coordinates?lat=&lng=` | Search stores near GPS coordinates |
| GET | `/api/stores/roll-dice-by-address?address=...` | Random store picker by address |
| GET | `/api/stores/roll-dice-by-coordinates?lat=&lng=` | Random store picker by coordinates |
| GET | `/api/stores/top-picks?area=...` | Get top 10 recommended stores |
| POST | `/api/auth/login` | User login (returns JWT token) |
| POST | `/api/auth/register` | New user registration |
| POST | `/api/stores` | Create new store (requires auth) |
| PUT | `/api/stores/:id` | Update store (owner/admin only) |
| DELETE | `/api/stores/:id` | Delete store (owner/admin only) |
| POST | `/api/stores/:storeId/favourite` | Add store to favourites |
| DELETE | `/api/stores/:storeId/favourite` | Remove from favourites |

## Geolocation & API Services
OpenSource Logic: This project utilizes OpenStreetMap (OSM) for all map data and coordinate logic.

No API Key Required

## Maintenance & Standards
Centralized Logic: All operational filters (Area, Cuisine, Tiers) are managed via a shared constants.js file to ensure the Frontend and Backend never disagree.

MVC Architecture: Follows a strict Model-View-Controller pattern to ensure the codebase is scalable and easy to maintain.

Performance Targets: Optimized for sub-200ms API response times and under 1.5s Frontend Load (LCP).


## Getting Started
## Default Admin Account (for testing)
1. Clone the Repository. Open Terminal and bash:
 git clone [Your-GitHub-URL] cd EatWhereApp

2. Backend Setup
Navigate to the /EatwhereAppBE directory. Open terminal bash:
npm install

3. Create a .env file with the following:
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=eatwhere_db
PORT=5000

4. Run the seeding script to populate your database. Open Terminal and bash:
 node seedStores.js

5. Frontend Setup
Navigate to the /EatWhereAppFE directory. Open terminal bash:
npm install

Start the development server, open terminal bash:
npm run dev

Access the app at http://localhost:5173


## Project Status
Current Phase: Logic & Script Construction (Working on script branch).
Developer: Costant Tan
Goal: Final Capstone Submission for TIPP.
