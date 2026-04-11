const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const app = express();
const publicPath = path.join(__dirname);
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "university.db");
const sessions = new Map();

const createSalt = () => crypto.randomBytes(16).toString("hex");
const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString("hex");
const createToken = () => crypto.randomBytes(32).toString("hex");
const getAuthToken = req => {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const authRequired = (req, res, next) => {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = session.user;
  req.token = token;
  next();
};

const safeUser = user => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
});

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

const ensureFacultyColumns = () => {
  db.all("PRAGMA table_info(faculty)", (err, rows) => {
    if (err) {
      console.error("Failed to inspect faculty table:", err);
      return;
    }

    const columns = rows.map(row => row.name);
    const alterClauses = [
      { name: "hire_date", sql: "ALTER TABLE faculty ADD COLUMN hire_date TEXT" },
      { name: "status", sql: "ALTER TABLE faculty ADD COLUMN status TEXT" },
      { name: "salary", sql: "ALTER TABLE faculty ADD COLUMN salary REAL" },
    ];

    alterClauses.forEach(({ name, sql }) => {
      if (!columns.includes(name)) {
        db.run(sql, err2 => {
          if (err2) {
            console.error(`Failed to add ${name} to faculty:`, err2.message);
          }
        });
      }
    });
  });
};

const createTables = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      program TEXT NOT NULL,
      status TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      department TEXT NOT NULL,
      credits INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      head TEXT NOT NULL,
      building TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      hire_date TEXT NOT NULL,
      status TEXT NOT NULL,
      salary REAL NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      hire_date TEXT NOT NULL,
      status TEXT NOT NULL,
      salary REAL NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      grade TEXT,
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_name TEXT NOT NULL,
      course_id INTEGER NOT NULL,
      exam_date TEXT NOT NULL,
      total_marks INTEGER NOT NULL,
      passing_marks INTEGER NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      enrollment_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      grade TEXT NOT NULL,
      remarks TEXT,
      FOREIGN KEY(exam_id) REFERENCES exams(id),
      FOREIGN KEY(enrollment_id) REFERENCES enrollments(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS finances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      department TEXT NOT NULL,
      amount_allocated REAL NOT NULL,
      amount_used REAL NOT NULL,
      period TEXT NOT NULL,
      status TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS infrastructure (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      condition TEXT NOT NULL,
      last_maintenance TEXT NOT NULL,
      next_maintenance TEXT NOT NULL,
      value REAL NOT NULL,
      responsible TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS testing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      category TEXT NOT NULL,
      environment TEXT NOT NULL,
      status TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      result_summary TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_name TEXT NOT NULL,
      deployment_type TEXT NOT NULL,
      target_environment TEXT NOT NULL,
      deployed_by TEXT NOT NULL,
      deploy_date TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS training (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_name TEXT NOT NULL,
      audience TEXT NOT NULL,
      trainer TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS alumni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      name TEXT NOT NULL,
      program TEXT NOT NULL,
      degree TEXT NOT NULL,
      graduation_year INTEGER NOT NULL,
      employer TEXT,
      contact_email TEXT,
      status TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )`);

    ensureFacultyColumns();
  });
};

const seedData = () => {
  const counts = {
    students: 0,
    courses: 0,
    departments: 0,
    faculty: 0,
    employees: 0,
    finances: 0,
    infrastructure: 0,
    testing: 0,
    deployments: 0,
    training: 0,
    alumni: 0,
    users: 0,
  };

  const inserts = () => {
    db.run(`INSERT INTO students (name, email, program, status) VALUES
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)`,
      [
        "Aisha Khan", "aisha.khan@university.edu", "Computer Science", "Active",
        "Michael Brown", "michael.brown@university.edu", "Business Administration", "Active",
        "Sophia Patel", "sophia.patel@university.edu", "Biology", "On Leave",
      ]
    );

    db.run(`INSERT INTO courses (title, code, department, credits) VALUES
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)`,
      [
        "Data Structures", "CS220", "Computer Science", 3,
        "Marketing Principles", "BA101", "Business", 3,
        "Cell Biology", "BI205", "Biology", 4,
      ]
    );

    db.run(`INSERT INTO departments (name, head, building) VALUES
      (?, ?, ?),
      (?, ?, ?),
      (?, ?, ?)`,
      [
        "Computer Science", "Dr. Angela White", "Newton Hall",
        "Business", "Dr. Kevin Myers", "Adams Center",
        "Biology", "Dr. Emily Grant", "Everest Hall",
      ]
    );

    db.run(`INSERT INTO faculty (name, title, department, email, hire_date, status, salary) VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Dr. Angela White", "Professor", "Computer Science", "a.white@university.edu", "2012-08-15", "Active", 125000,
        "Dr. Kevin Myers", "Associate Professor", "Business", "k.myers@university.edu", "2015-09-01", "Active", 98000,
        "Dr. Emily Grant", "Assistant Professor", "Biology", "e.grant@university.edu", "2018-01-22", "On Leave", 87000,
      ]
    );

    db.run(`INSERT INTO employees (name, role, department, email, hire_date, status, salary) VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Amina Saleem", "HR Manager", "Human Resources", "amina.saleem@university.edu", "2016-05-10", "Active", 85000,
        "Ravi Singh", "Payroll Specialist", "Human Resources", "r.singh@university.edu", "2019-11-03", "Active", 62000,
        "Maria Torres", "Recruitment Coordinator", "Human Resources", "m.torres@university.edu", "2020-04-18", "Active", 58000,
      ]
    );

    db.run(`INSERT INTO exams (exam_name, course_id, exam_date, total_marks, passing_marks) VALUES
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)`,
      [
        "Midterm Exam", 1, "2025-11-10", 100, 50,
        "Final Exam", 1, "2026-05-20", 100, 50,
        "Assessment Test", 2, "2026-03-05", 100, 45,
      ]
    );

    db.run(`INSERT INTO exam_results (exam_id, enrollment_id, score, grade, remarks) VALUES
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)`,
      [
        1, 1, 88, "A", "Strong performance",
        3, 2, 74, "B", "Solid understanding",
      ]
    );

    db.run(`INSERT INTO finances (item_name, department, amount_allocated, amount_used, period, status) VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)`,
      [
        "Library Expansion", "Library", 120000, 54000, "FY2026", "In Progress",
        "Lab Equipment", "Science", 95000, 76000, "FY2026", "Approved",
        "Student Scholarships", "Financial Aid", 200000, 180000, "FY2026", "Active",
      ]
    );

    db.run(`INSERT INTO infrastructure (asset_name, category, location, condition, last_maintenance, next_maintenance, value, responsible) VALUES
      (?, ?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Engineering Lab", "Building", "North Campus", "Good", "2026-01-15", "2026-07-15", 3200000, "Facilities Team",
        "Campus Network Switch", "Equipment", "Main IT Closet", "Fair", "2026-02-20", "2026-08-20", 42000, "IT Department",
        "Student Housing Complex", "Building", "South Campus", "Excellent", "2025-12-01", "2026-12-01", 7400000, "Housing Services",
      ]
    );

    db.run(`INSERT INTO testing (project_name, category, environment, status, start_date, end_date, result_summary) VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Student Portal QA", "Functional", "Staging", "In Progress", "2026-03-12", null, "Smoke tests underway",
        "Exam System Load Test", "Performance", "QA", "Completed", "2026-02-01", "2026-02-03", "Passed within threshold",
        "Alumni Portal Regression", "Regression", "Production", "Planned", "2026-04-20", null, "Scheduled after release",
      ]
    );

    db.run(`INSERT INTO deployments (system_name, deployment_type, target_environment, deployed_by, deploy_date, status, notes) VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Campus ERP", "Major", "Production", "DevOps Team", "2026-03-28", "Completed", "Core modules deployed successfully",
        "Network Monitoring", "Patch", "Staging", "IT Support", "2026-04-05", "In Progress", "Rolling out monitoring agents",
        "Student App", "Hotfix", "Production", "Release Team", "2026-04-09", "Completed", "Fixed login issue",
      ]
    );

    db.run(`INSERT INTO training (program_name, audience, trainer, start_date, end_date, location, status) VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Campus Safety Workshop", "Faculty", "Safety Office", "2026-05-10", "2026-05-11", "Conference Hall", "Scheduled",
        "Data Privacy Training", "Staff", "Compliance Team", "2026-04-18", "2026-04-18", "Online", "Completed",
        "Student Leadership", "Students", "Student Affairs", "2026-06-01", "2026-06-03", "Student Center", "Planned",
      ]
    );

    db.run(`INSERT INTO alumni (student_id, name, program, degree, graduation_year, employer, contact_email, status) VALUES
      (?, ?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, "Aisha Khan", "Computer Science", "BSc Computer Science", 2024, "TechWorks", "aisha.khan@alumni.edu", "Employed",
        2, "Michael Brown", "Business Administration", "BBA", 2023, "Global Markets", "michael.brown@alumni.edu", "Entrepreneur",
        null, "Layla Siddiqui", "Biology", "BSc Biology", 2022, "BioLife Labs", "layla.siddiqui@alumni.edu", "Alumni",
      ]
    );
  };

  db.serialize(() => {
    db.get("SELECT COUNT(*) AS count FROM students", (err, row) => {
      counts.students = row?.count || 0;
      if (counts.students === 0) inserts();
    });

    db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
      counts.users = row?.count || 0;
      if (counts.users === 0) {
        const salt = createSalt();
        const passwordHash = hashPassword("admin123", salt);
        db.run(
          "INSERT INTO users (full_name, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)",
          ["Administrator", "admin@university.edu", passwordHash, salt, "admin"]
        );
      }
    });
  });
};

const getQuerySql = entity => {
  switch (entity) {
    case "students":
      return "SELECT id, name, email, program, status FROM students";
    case "courses":
      return "SELECT id, title, code, department, credits FROM courses";
    case "departments":
      return "SELECT id, name, head, building FROM departments";
    case "faculty":
      return "SELECT id, name, title, department, email, hire_date, status, salary FROM faculty";
    case "employees":
      return "SELECT id, name, role, department, email, hire_date, status, salary FROM employees";
    case "exams":
      return `SELECT e.id, e.exam_name, c.title AS course_title, e.exam_date, e.total_marks, e.passing_marks
        FROM exams e
        JOIN courses c ON e.course_id = c.id`;
    case "exam_results":
      return `SELECT er.id, s.name AS student_name, ex.exam_name, c.title AS course_title, er.score, er.grade, er.remarks
        FROM exam_results er
        JOIN exams ex ON er.exam_id = ex.id
        JOIN enrollments en ON er.enrollment_id = en.id
        JOIN students s ON en.student_id = s.id
        JOIN courses c ON en.course_id = c.id`;
    case "finances":
      return "SELECT id, item_name, department, amount_allocated, amount_used, period, status FROM finances";
    case "infrastructure":
      return "SELECT id, asset_name, category, location, condition, last_maintenance, next_maintenance, value, responsible FROM infrastructure";
    case "testing":
      return "SELECT id, project_name, category, environment, status, start_date, end_date, result_summary FROM testing";
    case "deployments":
      return "SELECT id, system_name, deployment_type, target_environment, deployed_by, deploy_date, status, notes FROM deployments";
    case "training":
      return "SELECT id, program_name, audience, trainer, start_date, end_date, location, status FROM training";
    case "alumni":
      return "SELECT id, student_id, name, program, degree, graduation_year, employer, contact_email, status FROM alumni";
    case "enrollments":
      return `SELECT e.id, s.name AS student_name, c.title AS course_title, e.status, e.grade
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id`;
    default:
      return null;
  }
};

const getInsertQuery = entity => {
  switch (entity) {
    case "students":
      return {
        sql: "INSERT INTO students (name, email, program, status) VALUES (?, ?, ?, ?)",
        params: ["name", "email", "program", "status"],
      };
    case "courses":
      return {
        sql: "INSERT INTO courses (title, code, department, credits) VALUES (?, ?, ?, ?)",
        params: ["title", "code", "department", "credits"],
      };
    case "departments":
      return {
        sql: "INSERT INTO departments (name, head, building) VALUES (?, ?, ?)",
        params: ["name", "head", "building"],
      };
    case "faculty":
      return {
        sql: "INSERT INTO faculty (name, title, department, email, hire_date, status, salary) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params: ["name", "title", "department", "email", "hire_date", "status", "salary"],
      };
    case "employees":
      return {
        sql: "INSERT INTO employees (name, role, department, email, hire_date, status, salary) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params: ["name", "role", "department", "email", "hire_date", "status", "salary"],
      };
    case "finances":
      return {
        sql: "INSERT INTO finances (item_name, department, amount_allocated, amount_used, period, status) VALUES (?, ?, ?, ?, ?, ?)",
        params: ["item_name", "department", "amount_allocated", "amount_used", "period", "status"],
      };
    case "infrastructure":
      return {
        sql: "INSERT INTO infrastructure (asset_name, category, location, condition, last_maintenance, next_maintenance, value, responsible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params: ["asset_name", "category", "location", "condition", "last_maintenance", "next_maintenance", "value", "responsible"],
      };
    case "exams":
      return {
        sql: "INSERT INTO exams (exam_name, course_id, exam_date, total_marks, passing_marks) VALUES (?, ?, ?, ?, ?)",
        params: ["exam_name", "course_id", "exam_date", "total_marks", "passing_marks"],
      };
    case "exam_results":
      return {
        sql: "INSERT INTO exam_results (exam_id, enrollment_id, score, grade, remarks) VALUES (?, ?, ?, ?, ?)",
        params: ["exam_id", "enrollment_id", "score", "grade", "remarks"],
      };
    case "testing":
      return {
        sql: "INSERT INTO testing (project_name, category, environment, status, start_date, end_date, result_summary) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params: ["project_name", "category", "environment", "status", "start_date", "end_date", "result_summary"],
      };
    case "deployments":
      return {
        sql: "INSERT INTO deployments (system_name, deployment_type, target_environment, deployed_by, deploy_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params: ["system_name", "deployment_type", "target_environment", "deployed_by", "deploy_date", "status", "notes"],
      };
    case "training":
      return {
        sql: "INSERT INTO training (program_name, audience, trainer, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params: ["program_name", "audience", "trainer", "start_date", "end_date", "location", "status"],
      };
    case "alumni":
      return {
        sql: "INSERT INTO alumni (student_id, name, program, degree, graduation_year, employer, contact_email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params: ["student_id", "name", "program", "degree", "graduation_year", "employer", "contact_email", "status"],
      };
    case "enrollments":
      return {
        sql: "INSERT INTO enrollments (student_id, course_id, status, grade) VALUES (?, ?, ?, ?)",
        params: ["student_id", "course_id", "status", "grade"],
      };
    default:
      return null;
  }
};

const getSearchClause = entity => {
  switch (entity) {
    case "students":
      return "lower(name || ' ' || coalesce(email, '') || ' ' || coalesce(program, '') || ' ' || coalesce(status, '')) LIKE ?";
    case "courses":
      return "lower(title || ' ' || coalesce(code, '') || ' ' || coalesce(department, '')) LIKE ?";
    case "departments":
      return "lower(name || ' ' || coalesce(head, '') || ' ' || coalesce(building, '')) LIKE ?";
    case "faculty":
      return "lower(name || ' ' || coalesce(title, '') || ' ' || coalesce(department, '') || ' ' || coalesce(email, '') || ' ' || coalesce(hire_date, '') || ' ' || coalesce(status, '') || ' ' || coalesce(salary, '')) LIKE ?";
    case "employees":
      return "lower(name || ' ' || coalesce(role, '') || ' ' || coalesce(department, '') || ' ' || coalesce(email, '') || ' ' || coalesce(hire_date, '') || ' ' || coalesce(status, '') || ' ' || coalesce(salary, '')) LIKE ?";
    case "finances":
      return "lower(item_name || ' ' || coalesce(department, '') || ' ' || coalesce(period, '') || ' ' || coalesce(status, '')) LIKE ?";
    case "infrastructure":
      return "lower(asset_name || ' ' || coalesce(category, '') || ' ' || coalesce(location, '') || ' ' || coalesce(condition, '') || ' ' || coalesce(responsible, '')) LIKE ?";
    case "testing":
      return "lower(project_name || ' ' || coalesce(category, '') || ' ' || coalesce(environment, '') || ' ' || coalesce(status, '') || ' ' || coalesce(result_summary, '')) LIKE ?";
    case "deployments":
      return "lower(system_name || ' ' || coalesce(deployment_type, '') || ' ' || coalesce(target_environment, '') || ' ' || coalesce(deployed_by, '') || ' ' || coalesce(status, '') || ' ' || coalesce(notes, '')) LIKE ?";
    case "training":
      return "lower(program_name || ' ' || coalesce(audience, '') || ' ' || coalesce(trainer, '') || ' ' || coalesce(location, '') || ' ' || coalesce(status, '')) LIKE ?";
    case "alumni":
      return "lower(name || ' ' || coalesce(program, '') || ' ' || coalesce(degree, '') || ' ' || coalesce(employer, '') || ' ' || coalesce(contact_email, '') || ' ' || coalesce(status, '')) LIKE ?";
    case "exams":
      return "lower(e.exam_name || ' ' || coalesce(c.title, '')) LIKE ?";
    case "enrollments":
      return "lower(s.name || ' ' || c.title || ' ' || coalesce(e.status, '') || ' ' || coalesce(e.grade, '')) LIKE ?";
    case "exam_results":
      return "lower(s.name || ' ' || ex.exam_name || ' ' || c.title || ' ' || coalesce(er.grade, '')) LIKE ?";
    default:
      return null;
  }
};

app.post("/api/auth/register", (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: "All registration fields are required" });
  }

  db.get("SELECT id FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const salt = createSalt();
    const passwordHash = hashPassword(password, salt);

    db.run(
      "INSERT INTO users (full_name, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, passwordHash, salt, "user"],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const user = { id: this.lastID, full_name, email, role: "user" };
        const token = createToken();
        sessions.set(token, { user: safeUser(user) });
        res.status(201).json({ token, user: safeUser(user) });
      }
    );
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  db.get(
    "SELECT id, full_name, email, password_hash, password_salt, role FROM users WHERE email = ?",
    [email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const hashed = hashPassword(password, user.password_salt);
      if (hashed !== user.password_hash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = createToken();
      sessions.set(token, { user: safeUser(user) });
      res.json({ token, user: safeUser(user) });
    }
  );
});

app.get("/api/auth/me", authRequired, (req, res) => {
  res.json(req.user);
});

app.post("/api/auth/logout", authRequired, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

app.get("/api/:entity", authRequired, (req, res) => {
  const entity = req.params.entity.toLowerCase();
  const baseSql = getQuerySql(entity);
  if (!baseSql) {
    return res.status(404).json({ error: "Entity not found" });
  }

  const search = req.query.q ? `%${req.query.q.toLowerCase()}%` : null;
  const searchClause = getSearchClause(entity);
  const sql = search && searchClause ? `${baseSql} WHERE ${searchClause}` : baseSql;
  const params = search && searchClause ? [search] : [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post("/api/:entity", authRequired, (req, res) => {
  const entity = req.params.entity.toLowerCase();
  const insertDef = getInsertQuery(entity);
  if (!insertDef) {
    return res.status(404).json({ error: "Entity not found" });
  }

  const values = insertDef.params.map(param => req.body[param]);
  const requiredFields = insertDef.params.filter(param => param !== "remarks");
  if (requiredFields.some(param => {
    const value = req.body[param];
    return value === undefined || value === null || value === "";
  })) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.run(insertDef.sql, values, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

createTables();
seedData();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
