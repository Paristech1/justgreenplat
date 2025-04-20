# Microgreen Grower Portal

A comprehensive web-based SaaS platform for microgreen farmers to manage their crop planning, inventory tracking, sales forecasting, and order management.

## Features

- **Crop Cycle Planner**: Schedule plantings and harvests with a drag-and-drop calendar.
- **Inventory & Yield Tracker**: Monitor harvested weights and track real-time inventory.
- **Sales & Demand Forecasting**: Predict future demand based on historical data.
- **Order Management**: Handle customer orders and automate notifications.
- **Dashboard & Reporting**: Visual KPIs and exportable reports.

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI, Three.js
- **Backend**: Python FastAPI
- **Database**: In-memory storage (demo version)
- **Visualization**: Recharts, Three.js for 3D visualization

## Project Structure

```
microgreen-portal/
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main application pages
│   │   ├── theme/        # Styling and theme configuration
│   │   └── ...
│   └── ...
├── backend/              # FastAPI backend
│   ├── main.py           # API endpoints and business logic
│   └── ...
└── ...
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.8+

### Setup and Installation

1. **Backend**:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ./run.sh  # On Windows: run.bat
   ```

2. **Frontend**:
   ```
   cd frontend
   npm install
   npm run dev
   ```

3. Open your browser and navigate to:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## Usage

1. Start by exploring the Dashboard to see an overview of your microgreens operation
2. Use the Crop Planner to schedule upcoming plantings and harvests
3. Track your inventory and yields in the Inventory section
4. Manage customer orders through the Order Management page
5. Analyze trends and forecast demand with the Forecasting tools

## Screenshots

[Screenshots would go here in a real README]

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Created as a demonstration project
- Inspired by real microgreen farming operations 