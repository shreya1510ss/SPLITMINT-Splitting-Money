# 🌿 SplitMint - Smart Group Expense Management

> [!IMPORTANT]
> **[My thoughts and approach to building this app (SUBMISSION.md)](./SUBMISSION.md)** — A personal breakdown of the project's implementation, technical decisions, and trade-offs.

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**SplitMint** is a premium, full-stack group expense management application designed to take the friction out of splitting bills. Built with a modern tech stack and integrated with **MintSense AI**, it allows you to manage expenses effortlessly using natural language.

---

## ✨ Key Features

### 🔐 Secure Authentication
- JWT-based secure login and registration.
- Profile-based expense tracking.

### 👥 Group Centric Architecture
- Create or join multiple groups.
- Manage participants and group settings.
- Real-time balance updates within each group.

### 💸 Flexible Expense Splitting
- **Equal Split**: Automatically divide costs across all members.
- **Custom Amounts**: Precise control over who owes how much.
- **Percentage Split**: Divide by weightage or ratio.

### 🧠 MintSense AI (Gemini Powered)
- **Natural Language Extraction**: Just type "Paid 500 for pizza at Leo's with Rahul and Simran" and let AI handle the rest.
- **Group Summaries**: Get AI-generated insights into your group's spending habits.


### 📊 Smart Dashboard
- Clear overview of what you owe and what is owed to you.
- Minimalistic, premium UI with real-time data visualization.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS (Premium Dark/Light modes)
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (with Motor for async operations)
- **Security**: JWT (JSON Web Tokens) & Bcrypt hashing
- **AI Engine**: Google Gemini 3 Flash Preview

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **MongoDB** (Local or Atlas instance)
- **Gemini API Key** (for MintSense features)

### Backend Setup
1. Navigate to the `backend` folder.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` file:
   ```env
   MONGODB_URL=your_mongodb_connection_string
   SECRET_KEY=your_jwt_secret
   GEMINI_API_KEY=your_google_ai_key
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🎨 Design Philosophy
SplitMint is designed with **Rich Aesthetics** in mind. We prioritize:
- **Glassmorphism**: Subtle transparencies and blurry backgrounds.
- **Dynamic Micro-animations**: Smooth transitions for an interactive feel.
- **Responsive Layout**: Optimized for both desktop and mobile users.

---

## 📄 License
This project is licensed under the MIT License.