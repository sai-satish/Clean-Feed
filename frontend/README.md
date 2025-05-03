# ⚛️ Frontend – AI-Based Age-Aware Content Platform

This is the **React + TypeScript + TailwindCSS** frontend for the AI-powered age-personalization system. It provides a modern interface to capture facial images for real-time age verification and display personalized, age-appropriate content to users.

---

## 🧩 About the Frontend

The frontend acts as a user-friendly interface to the AI system, enabling:

- Secure facial image capture
- Age estimation results from the backend
- Personalized content display (reels, dashboard, uploads)
- Smooth SPA (Single Page Application) navigation and responsive design

This UI ensures a **privacy-aware** user experience while helping users interact with the core AI services effectively.

---

## 🔑 Key Features

- 🎨 **TailwindCSS-powered responsive UI**
- 🧠 **Age gate**: Webcam-based age verification using `getUserMedia()`
- 📺 **Dynamic reels/dashboard** filtered based on estimated age
- 📤 **Content upload interface** with moderation integration
- 🧼 **Creator controls** for content age-tagging
- ⚡ **Fast routing and client-side state management**
- 📄 **React Router v6+** for page transitions
- 🌙 Clean and modern UI/UX with potential for dark mode support

---

## 🛠️ Tech Stack

| Area           | Tools Used                              |
|----------------|------------------------------------------|
| Framework      | React 18+, Vite                         |
| Language       | TypeScript 5+                           |
| UI Styling     | TailwindCSS 3.3+                        |
| Routing        | React Router 6.15+                      |
| API Requests   | Axios 1.4+                              |
| Webcam Access  | Web API: `navigator.mediaDevices.getUserMedia` |
| State Handling | Context API + useState/useEffect        |

---

## 📁 Folder Structure

```bash
frontend/
├── public/                 # Static index.html and assets
├── src/
│   ├── components/         # Reusable UI elements (Navbar, Cards, Loader)
│   ├── pages/              # Screens: Login, Reels, Upload, Profile, AgeGate
│   ├── constants/                # Axios instances and API functions
│   ├── hooks/              # Custom React hooks
│   ├── contexts/              # Helpers (e.g. age filters)
│   ├── lib/             # Icons, logos, backgrounds
│   └── App.tsx            # Main application wrapper
├── tailwind.config.js      # TailwindCSS configuration
├── vite.config.ts          # Vite build setup
└── README.md               # You're here!
```
---

## 📡 API Endpoints Used

The frontend communicates with a FastAPI backend using the following RESTful APIs:

- `POST /predict-age`  
  → Accepts a facial image (captured via webcam) and returns predicted age and gender.

- `GET /recommendations`  
  → Returns age-appropriate personalized content for the logged-in user.

- `POST /upload-content`  
  → Allows users/creators to upload content along with metadata like title, description, and manual age tags.

- `GET /profile`  
  → Fetches the authenticated user's content and interaction data.

All requests use `application/json` headers, and media/image uploads use `multipart/form-data`.

---

## 🧪 Testing & Debugging

- All forms include client-side validation
- API errors are gracefully handled with UI feedback
- Development uses local `.env` for API base URLs
- Live reloading and debug logging are built-in via Vite

---

## 💻 How to Clone and Run Locally

```bash
# Step 1: Clone the repository
git clone https://github.com/sai-satish/Clean-Feed/.git
cd Clean-Feed/frontend

# Step 2: Install dependencies
npm install

# Step 3: Start the local development server
npm run dev

# The app should now be running at http://localhost:8080
```
---

⭐ If you find this project useful, don't forget to give it a star!
