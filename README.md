# EduVerse: AI-Powered Gamified E-Learning Platform

EduVerse is a full-stack AI-powered gamified e-learning platform designed to make learning engaging and effective. It combines interactive courses, adaptive quizzes, AI tutoring, and gamification elements to provide a unique educational experience.

## Features

*   **Interactive Courses:** Engaging content with progress tracking.
*   **Adaptive Quizzes:** AI-powered quizzes that adjust difficulty based on performance.
*   **AI Tutor:** A conversational AI assistant to help students with their queries.
*   **Gamification:** XP, levels, badges, and leaderboards to motivate learners.
*   **Community:** A platform for students to interact, share, and learn from each other.
*   **Educator Panel:** Tools for educators to create, manage, and publish courses and quizzes.
*   **Analytics Dashboard:** Visual insights into learning progress, accuracy, and streaks.
*   **Responsive Design:** Optimized for seamless experience across all devices.

## Technologies Used

**Frontend:**
*   React
*   TypeScript
*   Tailwind CSS
*   Wouter (for routing)
*   TanStack Query (for data fetching)
*   Recharts (for data visualization)

**Backend:**
*   Node.js
*   Express.js
*   TypeScript
*   Drizzle ORM (for PostgreSQL database interaction)
*   Replit Auth (for authentication)
*   Google Gemini API (for AI tutoring and quiz generation)
*   OpenAI API (for content moderation and personalized recommendations)

**Database:**
*   PostgreSQL

## Setup Instructions (Local Development)

To run EduVerse locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd EduVerse
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory of the project and populate it with the necessary environment variables. You can use `.env.example` as a template.

    ```
    DATABASE_URL="postgresql://user:password@host:port/database"
    SESSION_SECRET="your_strong_random_secret"
    ISSUER_URL="https://replit.com/oidc" # Only if using Replit Auth locally
    REPL_ID="your_replit_project_id" # Only if using Replit Auth locally
    REPLIT_DOMAINS="localhost:3000" # Only if using Replit Auth locally
    PORT="5000"
    OPENAI_API_KEY="your_openai_api_key"
    GEMINI_API_KEY="your_gemini_api_key"
    ```

4.  **Database Setup:**
    *   Ensure you have a PostgreSQL database running.
    *   Run Drizzle migrations to create tables:
        ```bash
        npm run db:push
        ```
    *   Seed the database with initial data (badges, sample courses, and quizzes):
        ```bash
        npm run db:seed
        ```

5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    This will start both the client (Vite) and the server (Express) in development mode. The client will typically be available at `http://localhost:5173` and the server at `http://localhost:5000`.

## Deployment on Replit

EduVerse is designed to be easily deployable on Replit. Ensure your `.replit` file is configured correctly to run the `start` script.

1.  **Configure Environment Variables:** Set your environment variables in Replit's Secrets tab.
2.  **Run the project:** Replit will automatically run the `start` script defined in `package.json`.

## Available Scripts

In the project directory, you can run:

*   `npm install`: Installs all project dependencies.
*   `npm run dev`: Starts the client (Vite) and server (Express) in development mode.
*   `npm run build`: Builds the client for production and compiles the server.
*   `npm run client:start`: Serves the production-ready client build.
*   `npm run server:start`: Starts the compiled Express server in production mode.
*   `npm start`: Runs both `server:start` and `client:start` concurrently for production deployment.
*   `npm run check`: Runs TypeScript type checking.
*   `npm run db:push`: Applies database migrations using Drizzle Kit.
*   `npm run db:seed`: Seeds the database with initial data.

## Environment Variables

Refer to the `.env.example` file for a list of all required environment variables and their descriptions.
