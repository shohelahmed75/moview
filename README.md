# FlickerBox

FlickerBox is a modern fullstack web application that lets you search for movies, view details, rate them, and manage your custom watched list. 

Now updated with user authentication and database persistence, FlickerBox ensures every user has their own private watchlist and set of movie ratings.

---

## Features

- **Multi-User Accounts & Authentication**: Secure sign-up, login, and token-based authentication (JWT) to protect user sessions.
- **Isolated Databases**: Watchlists and ratings are stored in an SQLite database, ensuring users only see their own content.
- **Search Movies**: Integrated with the OMDb API (using HTTPS) to search for movies by title.
- **Movie Details**: View detailed information (released date, director, actors, runtime, IMDb rating, and plot summaries).
- **Interactive Star Rating**: Rate movies using a custom stars component.
- **Watched Summary**: Dynamic stats calculations (movies watched, average IMDb rating, average user rating, and total watch duration).
- **Responsive & Dynamic UI**: Sleek, modern interface styled in a premium orange/gray color scheme.

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
