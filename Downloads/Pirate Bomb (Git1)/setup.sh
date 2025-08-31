#!/bin/bash

echo "🎮 Setting up Kaboom Production Server..."
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create database directory if it doesn't exist
echo "🗄️ Setting up database..."
if [ ! -f "player_data.db" ]; then
    echo "📝 Creating new database file..."
fi

# Start the server
echo "🚀 Starting production server..."
echo "=========================================="
echo "🎯 Game URL: http://localhost:3000/"
echo "📊 Admin Dashboard: http://localhost:3000/admin-dashboard.html"
echo "🔍 Simple Admin Panel: http://localhost:3000/admin-panel.html"
echo "=========================================="
echo "Press Ctrl+C to stop the server"
echo ""

npm start
