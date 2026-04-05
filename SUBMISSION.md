# 🚀 My thoughts and approach to building this app (SplitMint)

This document outlines the implementation strategy, technical decisions, and the iterative workflow used to build **SplitMint** within a tight development window.

---

## 🛠️ Implementation Strategy

My approach was rooted in **Incremental Development**. I divided the entire project into small, manageable tasks and focused on completing them one at a time. This helped in maintaining focus and ensuring that each feature was stable before moving to the next.

1.  **Backend First**: I began by building the core logic and API endpoints in the backend. This was also broken down into small tasks (Auth, Groups, Expenses, Balances) to ensure a solid foundation.
2.  **Frontend Integration**: Once the backend was functional, I shifted focus to the frontend to connect the UI with the existing APIs.
3.  **Iterative Refinement**: As the project progressed, I worked on both frontend and backend simultaneously, making adjustments to the API or the UI as I discovered better ways to implement specific features.

---

## 🏗️ Technical Decisions & Trade-offs

### 1. Backend: FastAPI
I chose **FastAPI** due to its high performance and modern asynchronous support. Given the potential for many concurrent requests in a real-world expense management app, FastAPI was the most efficient choice.

### 2. Database: MongoDB
**MongoDB** was used because of my familiarity with it and the time constraints of the project. I needed a database that allowed for quick schema iterations as the "Expense" and "Group" data models evolved.

### 3. Frontend & UI
Since I have a 2-day constraint and the frontend is a relatively new area for me, I prioritized the **logic and functionality** of the application over custom frontend crafting. 
- I leveraged **Cursor** extensively to assist with the frontend implementation. 
- This decision was a deliberate trade-off: I chose to focus on a perfectly working application logic rather than spending excessive time on custom frontend details, which might have compromised the core features.

### 4. AI Integration (MintSense)
The AI features (Gemini-powered natural language parsing) were implemented at the very end. Since AI integration was a new area for me, I wanted to ensure that the core "manual" functionality of the app was rock-solid before adding the AI layer.

---

## 🔄 Version Control & Reliability

I followed a strict habit of **frequent commits to GitHub**. This was essential for:
-   **Progress Tracking**: Keeping a clear log of what was implemented and when.
-   **Risk Management**: Providing a safety net so that if a new change broke existing features, I could easily revert to a stable state.

---

## ✅ Final Result
By following this task-oriented and iterative approach, I was able to deliver a full-stack application that successfully handles complex expense splitting logic, real-time balance tracking, and AI-powered data extraction.
