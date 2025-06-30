# StreakSync - Habit Tracking Application

StreakSync is a web application designed to help you track your daily tasks and build consistent habits. It visualizes your progress and streaks, motivating you to stay on track with your goals. The application supports local user accounts and Google OAuth for easy sign-in.

## Features

*   User registration and login (local accounts and Google OAuth)
*   Daily task management: Add, complete, and delete tasks for the current day.
*   Progress visualization: See your daily completion percentage.
*   Streak tracking: View a calendar of your task completion percentages over time.
*   Responsive design: Usable across desktops, tablets, and mobile devices.

## Tech Stack

*   **Backend**: Node.js, Express.js
*   **Database**: PostgreSQL
*   **Authentication**: Passport.js (Local Strategy, Google OAuth 2.0)
*   **Templating**: EJS (Embedded JavaScript templates)
*   **Frontend**: HTML, CSS, EJS
*   **Dependencies**: `bcrypt`, `body-parser`, `dotenv`, `express-session`, `nodemon`, `pg`, `uuid`

## Prerequisites

*   Node.js (v14 or later recommended)
*   npm (usually comes with Node.js)
*   PostgreSQL server installed and running.

## Setup Instructions

1.  **Clone the Repository (if applicable)**
    ```bash
    git clone <repository-url>
    cd streak-sync
    ```

2.  **Install Dependencies**
    Navigate to the project directory in your terminal and run:
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**
    *   Create a `.env` file in the root of the project directory by copying the example file:
        ```bash
        cp .env.example .env
        ```
    *   Open the `.env` file and fill in your specific configuration details:
        *   `PORT`: The port the application will run on (e.g., `3000`).
        *   `DB_USER`: Your PostgreSQL username.
        *   `DB_HOST`: Your PostgreSQL host (usually `localhost`).
        *   `DB_DATABASE`: The name for your PostgreSQL database (e.g., `streak_sync_db`).
        *   `DB_PASSWORD`: Your PostgreSQL password.
        *   `DB_PORT`: Your PostgreSQL port (usually `5432`).
        *   `SESSION_SECRET`: A long, random string for securing sessions.
        *   `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
        *   `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
        *   `CALLBACK_URL`: The Google OAuth callback URL (e.g., `http://localhost:3000/auth/google/streaksync` if running on port 3000).
            *   **Important**: This URL must be registered as an authorized redirect URI in your Google Cloud Console project for the OAuth credentials.

4.  **Set Up Google OAuth Credentials**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
    *   Navigate to "APIs & Services" > "Credentials".
    *   Create new OAuth 2.0 credentials (OAuth client ID).
    *   Select "Web application" as the application type.
    *   Add an "Authorized JavaScript origin" (e.g., `http://localhost:3000`).
    *   Add an "Authorized redirect URI". This **must match** the `CALLBACK_URL` you set in your `.env` file (e.g., `http://localhost:3000/auth/google/streaksync`).
    *   Copy the generated Client ID and Client Secret into your `.env` file.

5.  **Set Up the Database**
    *   Ensure your PostgreSQL server is running.
    *   Create the database specified in your `.env` file (e.g., `streak_sync_db`). You can use a tool like `psql` or a GUI like pgAdmin.
        Example using `psql`:
        ```bash
        psql -U your_db_user -c "CREATE DATABASE streak_sync_db;"
        ```
        (Replace `your_db_user` and `streak_sync_db` as needed.)
    *   Connect to your newly created database and run the SQL script to create the necessary tables.
        Example using `psql`:
        ```bash
        psql -U your_db_user -d streak_sync_db -f database.sql
        ```
        (Ensure `database.sql` is in your current directory or provide the correct path.)

## Running the Application

Once all the setup steps are complete, you can start the application using:

```bash
npm start
```

This will start the server using `nodemon`, which automatically restarts the server when file changes are detected.
The application should then be accessible at `http://localhost:PORT` (e.g., `http://localhost:3000` if `PORT=3000`).

## Project Structure

```
.
├── public/                     # Static assets
│   └── css/
        └──images
│       └── style.css           # Main stylesheet
├── views/                      # EJS templates
│   ├── app.ejs                 # Main application dashboard
│   ├── home.ejs                # Home page
│   ├── signup.ejs              # Signup/Login page
│   └── streak.ejs              # Streak visualization page
├── .env                        # Example environment variables
├── .gitignore                  # Files to ignore for Git
├── app.js                      # Main Express application file
├── database.sql                # PostgreSQL schema setup
├── package-lock.json           # Exact dependency versions
├── package.json                # Project metadata and dependencies
└── README.md                   # This file
```

## Contributing

Feel free to fork the repository, make changes, and submit pull requests. If you find any issues or have suggestions for improvements, please open an issue.