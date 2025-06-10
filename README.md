# 📥 SangrahKaro - YouTube Video Downloader

SangrahKaro is a full-stack YouTube video downloader built with the MERN stack (MongoDB, Express.js, React, Node.js). It allows users to paste a YouTube video URL and download it via a clean, responsive interface.

---

## 🚀 Features

- 🎬 Download YouTube videos by pasting the URL  
- 💻 React frontend styled with Tailwind CSS  
- 🔧 Express.js backend with dynamic port using `.env`  
- 🌐 Cross-platform support  
- 📂 Clean folder structure for easy navigation  

---

## 🛠️ Technologies Used

- **Frontend:** React, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Environment Variables:** dotenv  

---


## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/SangrahKaro-An-YouTube-Video-Downloader.git
cd SangrahKaro-An-YouTube-Video-Downloader
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

#### Create a `.env` file at `backend/config/.env`:

```env
PORT=3000
```

#### Start the backend server:

```bash
node index.js
```

---

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
```

#### Update `src/config.js` with your backend URL:

```js
export const BASE_URL = 'http://localhost:3000'; // Adjust if needed
```

#### Start the React app:

```bash
npm start
```

---

## 🧪 How to Use

1. Launch the frontend in your browser (`http://localhost:3000` by default).  
2. Paste a YouTube video URL into the input field.  
3. Click the **Download** button.  
4. The backend fetches the video and makes it available for download.  

---

## Important Notes
- Ensure that you have Node.js installed.
- The backend server needs to be running for the frontend to fetch video data.
- Ensure that the .env file is properly configured with the correct port number.

---
