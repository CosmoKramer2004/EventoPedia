#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting TBS Development Environment...${NC}"

# 1. Check MongoDB
echo -e "${BLUE}📦 Checking MongoDB...${NC}"
if ! pgrep -x "mongod" > /dev/null; then
    echo "MongoDB is not running. Starting via brew services..."
    brew services start mongodb-community
    sleep 2
else
    echo -e "${GREEN}MongoDB is already running.${NC}"
fi

# 2. Python Setup (Recommendation Service)
echo -e "${BLUE}🐍 Setting up Python environment...${NC}"
cd recommendation_service

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Starting Recommendation Service (Background)..."
python app.py > ../recommendation_service.log 2>&1 &
PYTHON_PID=$!
echo -e "${GREEN}Recommendation Service started (PID: $PYTHON_PID)${NC}"

cd ..

# 3. Node Setup
echo -e "${BLUE}📦 Setting up Node environment...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

# 4. Seed Database (Optional)
# Check if we should seed
read -p "Do you want to seed the database? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    npm run seed
fi

# 5. Start Next.js Server
echo -e "${BLUE}🚀 Starting Next.js Server...${NC}"
echo -e "${GREEN}Application will be available at http://localhost:3000${NC}"

# Trap to kill Python process on exit
trap "kill $PYTHON_PID" EXIT

npm run dev
