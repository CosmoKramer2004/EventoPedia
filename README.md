# Eventopedia 🎟️

**Eventopedia** is a modern, full-stack event booking platform that combines a sleek UI with an AI-powered recommendation engine. It allows users to discover events, book tickets with interactive seat selection, and receive personalized suggestions based on their interests.

![Eventopedia UI](public/images/concert.png)

## 🚀 Features

### 🌟 Core Functionality
*   **Event Discovery:** Browse events by category, location, and date with advanced filtering.
*   **Interactive Booking:** Select specific seats from a visual map.
*   **Concurrency Control:** Real-time seat locking prevents double-booking during checkout.
*   **PDF Tickets:** Automatically generates downloadable PDF tickets with QR codes upon booking.
*   **Role-Based Access:** Distinct portals for **Users**, **Producers** (Event Creators), and **Admins**.

### 🧠 AI Recommendation Engine
*   **Personalized Feeds:** Uses **Cosine Similarity** on vector embeddings to recommend events similar to what you like.
*   **Smart Fallback:** Automatically switches to "Trending Events" for new users to ensure a rich experience from day one.
*   **Tech:** Powered by Python, `sentence-transformers`, and MongoDB Vector Search.

### 🎨 Modern UI/UX
*   **Responsive Design:** Fully optimized for Desktop, Tablet, and Mobile.

## 🛠️ Tech Stack

*   **Frontend:** [Next.js](https://nextjs.org/) (React Framework)
*   **Backend:** Node.js with [Express](https://expressjs.com/)
*   **Database:** [MongoDB](https://www.mongodb.com/) (NoSQL)
*   **AI Service:** Python ([Flask](https://flask.palletsprojects.com/), `sentence-transformers`, `scikit-learn`)
*   **Styling:** CSS Modules with Custom Variables

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   MongoDB (Running locally or Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/CosmoKramer2004/EventoPedia.git
cd EventoPedia
```

### 2. Install Dependencies

**Frontend & Backend (Node.js):**
```bash
npm install
```

**AI Service (Python):**
```bash
cd recommendation_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. Configure Environment
Create a `.env` file in the root directory (optional, defaults provided in code):
```env
MONGODB_URI=mongodb://localhost:27017/neontix
PORT=3000
```

### 4. Seed the Database
Populate the database with sample users, events, and bookings:
```bash
npm run seed
```

### 5. Run the Application
We have a helper script to start everything (Node Server + Python AI Service) at once:
```bash
./start_dev.sh
```
*   **Frontend/Backend:** `http://localhost:3000`
*   **AI Service:** `http://localhost:5001`

## 🧪 Usage

1.  **Login:**
    *   **User:** `user` / `password`
    *   **Producer:** `producer` / `password`
    *   **Admin:** `admin` / `password`
2.  **Book a Ticket:** Go to an event, select seats, and click "Book".
3.  **Get Recommendations:** Click "I'm Interested" on a few events, then refresh the home page to see "Top Picks for You".

## 📂 Project Structure

```
├── src/
│   ├── app/              # Next.js Pages & Routes
│   ├── components/       # React Components (Navbar, EventCard)
│   └── context/          # Global State (AuthContext)
├── server.js             # Custom Express Server (API Gateway)
├── recommendation_service/
│   ├── app.py            # Python Flask AI Service
│   └── requirements.txt  # Python Dependencies
├── lib/
│   ├── db/               # MongoDB Connection
│   └── models/           # Mongoose Schemas (User, Event, Booking)
└── public/               # Static Assets
```


