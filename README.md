# University Management System Website

A simple responsive website for university administration. It now uses a backend API, SQLite database, and a core identity module for user registration and login.

## Features

- User registration and login
- Dashboard stats for students, courses, departments, faculty, and enrollments
- Enrollment management for students and courses
- Interactive tables with search filtering
- Add new records using a modal form
- Authenticated API access with SQLite persistence in `data/university.db`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open the app in the browser:

```text
http://localhost:3000
```

## Authentication

- Use the registration form to create a new account.
- A default administrator user is seeded automatically:
  - Email: `admin@university.edu`
  - Password: `admin123`

## Notes

- The server is implemented in `server.js`.
- Static files are served from the project root.
- Database file is created automatically in the `data` folder.
