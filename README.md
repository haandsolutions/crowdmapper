# CrowdMapper

A crowd-monitoring application that helps users discover and navigate locations by providing real-time busyness levels, interactive maps, and community-driven insights.

## Project Setup Instructions

### 1. Creating a New Replit Project
1. Go to [Replit](https://replit.com) and create a new project
2. Choose the "Node.js" template
3. Name your project (e.g., "CrowdMapper")
4. Click "Create Repl"

### 2. Importing the Project Files
1. Delete all the default files in the new Replit project
2. Upload the contents of this ZIP file to the root of your Replit project
3. Make sure all directories (client, server, shared) are at the root level

### 3. Setting up Environment Variables
1. Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=your_postgres_database_url
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Installing Dependencies
Run the following commands in the Replit Shell:
```bash
npm install
```

### 5. Setting up PostgreSQL Database
1. Use the Replit Database feature to create a new PostgreSQL database
2. Update the `.env` file with the provided database URL

### 6. Running Migrations (if using a database)
```bash
npm run db:push
```

### 7. Setting up the Workflow
1. In the Replit Tools menu, go to "Workflows"
2. Create a new workflow named "Start application"
3. Enter the command: `npm run dev`
4. Save the workflow

### 8. Running the Application
1. Start the application using the "Start application" workflow
2. The app will be accessible at your Replit URL

## Technology Stack
- React frontend with TypeScript
- Express.js backend
- PostgreSQL database
- Zod for data validation
- Geolocation and mapping integrations
- Shadcn/ui for component styling
- TailwindCSS for responsive design
- Google Maps API integration for location rendering

## Project Structure
- `client/`: Frontend React application
- `server/`: Backend Express server
- `shared/`: Shared types and utilities
- `.env`: Environment variables
- `package.json`: Project dependencies

## Features
- Real-time crowd level monitoring
- Interactive map with location markers
- Location details with crowd history
- User check-ins and reviews
- Profile management
- Mobile-responsive design