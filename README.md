# Advanced Node & Express — Chat App with Authentication

This project is built for the FreeCodeCamp **Advanced Node and Express** curriculum and extends the boilerplate to include:

- User registration and login with Passport (local username/password and GitHub OAuth)
- Session persistence with MongoDB via `connect-mongo`
- Real-time chat using Socket.IO
- Authenticated socket connections using `passport.socketio`
- Live user count, join/leave announcements & messaging across clients

---

## Features

- Local authentication (username/password)
- GitHub OAuth login
- Persistent session store in MongoDB
- Express middleware for sessions, static assets, JSON + URL-encoded forms
- Protected routes (`/profile`, `/chat`, etc.)
- Real-time chat functionality:
  - Live user count
  - Broadcast when users join or leave
  - Send and receive chat messages across all clients
- Modular structure:
  - `server.js` — app entry point  
  - `routes.js` — HTTP route definitions  
  - `auth.js` — Passport & strategy setup  
  - Views in `./views/pug` (Pug templates)  
  - Public assets in `./public`

---

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Exstee/advanced-node.git
   cd advanced-node
````

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create a `.env` file** (or set environment variables) in the project root:

   ```env
   MONGO_URI=<Your MongoDB connection string>
   SESSION_SECRET=<A random string for session encryption>
   GITHUB_CLIENT_ID=<Your GitHub OAuth App Client ID>
   GITHUB_CLIENT_SECRET=<Your GitHub OAuth App Client Secret>
   GITHUB_CALLBACK_URL=<Your OAuth callback URL, e.g. https://your-app.com/auth/github/callback>
   ```

4. **Start the app:**

   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

5. **Visit** `http://localhost:3000` (or your deployed URL) and test:

   * Register a user or login via GitHub
   * Visit `/chat` after login to join the real-time chat room

---

## Deployment

* This project can easily be deployed on platforms such as **Render**, **Heroku**, or **Replit**.
* On Render:

  * Set **Build Command** to `npm install`
  * Set **Start Command** to `node server.js`
  * Add all environment variables in the Render dashboard
* Ensure your GitHub OAuth App’s **Authorization callback URL** matches the deployment domain + `/auth/github/callback`.

---

## Technical Details & Usage

* **Sessions & store:** `express-session` configured with `key: 'express.sid'` and `connect-mongo` for persistence
* **Socket authentication:** `passport.socketio` parses session cookies and links socket connections to authenticated sessions
* **Real-time events:**

  * `'user'` — emits `{ username, currentUsers, connected }` when users join or leave
  * `'chat message'` — broadcasts `{ username, message }` to all clients
* **Client listeners:**

  * On `'user'`, the client updates the user count and appends a join/leave message
  * On `'chat message'`, the client appends the chat message to the list

---

## License

Licensed under the [MIT License](LICENSE).