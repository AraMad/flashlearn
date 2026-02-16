# FlashLearn

FlashLearn is a feature-rich, high-performance flashcard study application designed for students and life-long learners. It provides a Quizlet-like experience with multiple interactive study modes, robust set management, and offline-first capabilities.

## 🚀 Base Features

### 📖 Study Modes
*   **Flashcards (Review):** A classic swipe-to-study experience. Swipe right if you know it, left if you need more practice.
*   **Learn:** An adaptive mode that mixes True/False, Multiple Choice, and Written tasks to ensure deep memorization.
*   **Match:** A high-speed memory game where you race against the clock to match terms with their definitions.
*   **Test:** A customizable testing engine where you can set question types, counts, and "answer with" preferences to simulate real exam conditions.

### 🛠 Set Management
*   **Interactive Editor:** Create and edit sets with ease.
*   **Bulk Import:** Quickly add cards by pasting text delimited by dashes, commas, or semicolons.
*   **Smart Tagging:** Organize your library with tags and filter by favorites.
*   **Progress Tracking:** Visual indicators show exactly how much of each set you have mastered.
*   **Strict Optimization:** Sets are optimized for mobile performance with a limit of 50 cards per set.

### 🔒 Data & Reliability
*   **Offline First:** Works anywhere without an internet connection using PWA technology and Service Workers.
*   **LocalStorage Persistence:** All study data is saved locally in your browser.
*   **Backup & Restore:** Export your entire library to a JSON file for safe keeping or to transfer between devices.
*   **Privacy-Centric:** No accounts required, no trackers, and your data never leaves your device unless you export it.

## 🛠 Tech Stack

*   **Framework:** [React 19](https://react.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Build System:** [Vite](https://vitejs.dev/)
*   **Persistence:** Web Storage (LocalStorage)
*   **PWA:** Service Workers & Web App Manifest
*   **Deployment:** GitHub Pages via GitHub Actions

## 📦 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm

### Installation
1.  Clone the repository
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Deployment
The project is configured for GitHub Pages. Simply push to the `main` branch to trigger the automatic deployment workflow.

---
*Built with passion for efficient learning.*