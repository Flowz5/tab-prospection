# 🚀 StageTrack

StageTrack is a lightweight, modern, and collaborative web app built to help students track their internship applications and share good opportunities with their squad. Built with React, Tailwind CSS, and Firebase.

## ✨ Features

- **📊 Dashboard Pipeline**: Track your applications using two main lists: "À Contacter" (companies you want to target) and your actual sent applications. 
- **🏷️ Tags & Notes**: Add custom tags, external URLs, and personal notes to every application.
- **🌑 Dark Mode**: Native dark mode support, saved in your browser's local storage.
- **📈 Live Statistics**: A dedicated stats page with beautiful circular progress bars to track your conversion rate (Interviews, Acceptances, Refusals).
- **🤝 Bons Plans (Collaborative Feed)**: A shared feed where authenticated users can post internship opportunities (Company, Location, Positions, Description) and share them with the rest of the squad.
- **📄 Export to PDF & CSV**: One-click export of your entire tracking table to a clean PDF or CSV file for your end-of-year internship report.
- **🔒 Secure & Private**: Your dashboard data is strictly private to your account using Firebase Security Rules.

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Lucide React (Icons)
- **Backend/Database**: Firebase Authentication (Email/Password) + Cloud Firestore
- **Deployment**: Vercel
- **Libraries**: `date-fns` (dates), `jspdf` & `jspdf-autotable` (PDF export)

## 🚀 Getting Started (Local Development)

1. **Clone the repo**
   ```bash
   git clone https://github.com/Flowz5/tab-prospection.git
   cd tab-prospection
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a project on [Firebase](https://firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Create a `.env.local` file in the root directory and add your Firebase config keys (if you want to override the default ones in `services/firebase.js`).

4. **Firestore Rules**
   To ensure the app works correctly and securely, apply these rules in your Firebase Console:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Dashboard security: users only see/edit their own data
       match /applications/{docId} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null;
       }
       // Bons Plans security: anyone logged in can read/create, but only the author can delete
       match /bonsplans/{docId} {
         allow read, create: if request.auth != null;
         allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

5. **Start the dev server**
   ```bash
   npm run dev
   ```

## 🚢 Deployment (Vercel)

The app is optimized for Vercel deployment. It includes a `vercel.json` file that handles Single Page Application (SPA) routing, so refreshing on specific routes (like `/bons-plans`) won't trigger a 404 error.

---
*Built with ❤️ for students struggling to find internships.*
