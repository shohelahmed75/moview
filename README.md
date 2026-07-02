# FlickerBox

FlickerBox is a modern fullstack web application that lets you search for movies, view details, rate them, and manage your custom watched list. 

Now updated with user authentication, database persistence, and a premium design, FlickerBox ensures every user has their own private watchlist and set of movie ratings.

---

## Features

- **Multi-User Accounts & Authentication**: Secure sign-up, login, and token-based authentication (JWT) to protect user sessions.
- **Isolated Databases**: Watchlists and ratings are stored in an SQLite database, ensuring users only see their own content.
- **Search Movies**: Integrated with the OMDb API (using HTTPS) to search for movies by title.
- **Floating Search Suggestions Dropdown**: Suggestion items appear dynamically under the search input with titles, years, and thumbnail images. Click-outside listener closes the menu.
- **Separate Mobile Search Row**: On mobile screens, the search bar resides on a dedicated extra row below the header bar.
- **Mobile Responsive Hamburger Drawer**: On phones, the navbar collapses into a 3-bar hamburger icon on the right, which opens a drawer showing the user profile, logout actions, and watched list stats.
- **Movie Details**: View detailed information (released date, director, actors, runtime, IMDb rating, and plot summaries).
- **Interactive Star Rating**: Rate movies using a custom stars component.
- **4-Column Watched Card Grid**: Overhauled Watched Movies list into a card grid layout showing 4 items per row on desktop, collapsing dynamically to 3, 2, and 1 item(s) as screen size decreases.
- **Landscape Poster Cover Images**: Watchlist items display horizontal cover posters (`16:9` ratio) instead of traditional vertical layout orientations.
- **Watched Summary**: Dynamic stats calculations (movies watched, average IMDb rating, average user rating, and sum of total watch duration).
- **Clean Aesthetic**: A modern premium interface inspired by Framer templates with a black capsule navbar, high border-radii cards, smooth micro-animations, and clean typography. Contains no code comments for a clean repository profile.

---

## Tech Stack

- **Frontend**: React (Hooks, state composition, customized components)
- **Backend**: Node.js & Express (REST APIs, routing, JWT auth middleware)
- **Database**: SQLite (via `sqlite3` for light, serverless local storage)
- **Security**: Password hashing using `bcryptjs` and session tokens signed using `jsonwebtoken`

---

## Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Clone the Repository
```bash
git clone https://github.com/shohelahmed75/FlickerBox.git
cd FlickerBox
```

### 3. Install Dependencies
Installs both frontend dependencies and backend package requirements:
```bash
npm install
```

### 4. Run Locally (Development Mode)
Start the frontend client (port `3000`) and backend server (port `5001`) concurrently:
```bash
npm run dev
```

The app will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

You can configure the following environment variables in a `.env` file at the project root or through your hosting provider:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port for the backend server | `5001` |
| `JWT_SECRET` | Secret key used to sign JSON Web Tokens | `flickerbox-secret-key-12345` |

---

## Deployment & Hosting

FlickerBox is fully prepared for one-click fullstack deployments to services like **Render**, **Railway**, or **Fly.io**.

### Steps for Deployment (e.g. Render):
1. Create a new **Web Service** pointing to your repository.
2. Configure build and start commands:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. Add the `JWT_SECRET` environment variable under your service settings.
4. Deploy! The server will build the React frontend and host both the API endpoints and static assets under a single domain.
