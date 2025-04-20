#!/bin/bash

# Start the backend server in the background
echo "Starting the backend server..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 2

# Start the frontend server
echo "Starting the frontend server..."
cd ../frontend
npm run dev

# When the frontend server is stopped, also stop the backend
kill $BACKEND_PID 