const apiBase = "/api";
const auth = { token: null, user: null };
const state = {
  students: [],
  courses: [],
  departments: [],
  faculty: [],
  employees: [],
  finances: [],
  infrastructure: [],
  testing: [],
  deployments: [],
  training: [],
  alumni: [],
  enrollments: [],
  exams: [],
  examResults: [],
};

const selectors = {
  authScreen: document.getElementById("authScreen"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  toggleAuth: document.getElementById("toggleAuth"),
  authTitle: document.getElementById("authTitle"),
  authPrompt: document.getElementById("authPrompt"),
  authError: document.getElementById("authError"),
  currentUser: document.getElementById("currentUser"),
  logoutBtn: document.getElementById("logoutBtn"),
  appShell: document.getElementById("appShell"),
  studentTable: document.getElementById("studentTable"),
  courseTable: document.getElementById("courseTable"),
  examTable: document.getElementById("examTable"),
  examResultTable: document.getElementById("examResultTable"),
  departmentTable: document.getElementById("departmentTable"),
  facultyTable: document.getElementById("facultyTable"),
  alumniTable: document.getElementById("alumniTable"),
  financeTable: document.getElementById("financeTable"),
  infrastructureTable: document.getElementById("infrastructureTable"),
  employeeTable: document.getElementById("employeeTable"),
  enrollmentTable: document.getElementById("enrollmentTable"),
  studentCount: document.getElementById("studentCount"),
  courseCount: document.getElementById("courseCount"),
  examCount: document.getElementById("examCount"),
  enrollmentCount: document.getElementById("enrollmentCount"),
  departmentCount: document.getElementById("departmentCount"),
  facultyCount: document.getElementById("facultyCount"),
  employeeCount: document.getElementById("employeeCount"),
  financeCount: document.getElementById("financeCount"),
  infrastructureCount: document.getElementById("infrastructureCount"),
  testingCount: document.getElementById("testingCount"),
  deploymentCount: document.getElementById("deploymentCount"),
  trainingCount: document.getElementById("trainingCount"),
  alumniCount: document.getElementById("alumniCount"),
  modal: document.getElementById("modalForm"),
  modalTitle: document.getElementById("modalTitle"),
  formFields: document.getElementById("formFields"),
  entityForm: document.getElementById("entityForm"),
  addStudentBtn: document.getElementById("addStudentBtn"),
  addCourseBtn: document.getElementById("addCourseBtn"),
  addExamBtn: document.getElementById("addExamBtn"),
  addExamResultBtn: document.getElementById("addExamResultBtn"),
  addEnrollmentBtn: document.getElementById("addEnrollmentBtn"),
  addDepartmentBtn: document.getElementById("addDepartmentBtn"),
  addEmployeeBtn: document.getElementById("addEmployeeBtn"),
  addFinanceBtn: document.getElementById("addFinanceBtn"),
  addInfrastructureBtn: document.getElementById("addInfrastructureBtn"),
  addTestingBtn: document.getElementById("addTestingBtn"),
  addDeploymentBtn: document.getElementById("addDeploymentBtn"),
  addTrainingBtn: document.getElementById("addTrainingBtn"),
  addAlumniBtn: document.getElementById("addAlumniBtn"),
  addFacultyBtn: document.getElementById("addFacultyBtn"),
  closeModal: document.getElementById("closeModal"),
  cancelForm: document.getElementById("cancelForm"),
  studentSearch: document.getElementById("studentSearch"),
  courseSearch: document.getElementById("courseSearch"),
  examSearch: document.getElementById("examSearch"),
  examResultSearch: document.getElementById("examResultSearch"),
  enrollmentSearch: document.getElementById("enrollmentSearch"),
  departmentSearch: document.getElementById("departmentSearch"),
  testingSearch: document.getElementById("testingSearch"),
  deploymentSearch: document.getElementById("deploymentSearch"),
  trainingSearch: document.getElementById("trainingSearch"),
  facultySearch: document.getElementById("facultySearch"),
  employeeSearch: document.getElementById("employeeSearch"),
  financeSearch: document.getElementById("financeSearch"),
  infrastructureSearch: document.getElementById("infrastructureSearch"),
  alumniSearch: document.getElementById("alumniSearch"),
};

const saveAuth = () => {
  localStorage.setItem("uniAuth", JSON.stringify({ token: auth.token, user: auth.user }));
};

const loadAuth = () => {
  const raw = localStorage.getItem("uniAuth");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    auth.token = parsed.token || null;
    auth.user = parsed.user || null;
  } catch {
    auth.token = null;
    auth.user = null;
  }
};

const getAuthHeaders = () => {
  if (!auth.token) return {};
  return { Authorization: `Bearer ${auth.token}` };
};

const authFetch = async (url, options = {}) => {
  const headers = { ...options.headers, ...getAuthHeaders() };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response;
};

const fetchEntity = async (entity) => {
  const response = await authFetch(`${apiBase}/${entity}`);
  return response.json();
};

const postEntity = async (entity, payload) => {
  const response = await authFetch(`${apiBase}/${entity}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.json();
};

const updateStats = () => {
  selectors.studentCount.textContent = state.students.length;
  selectors.courseCount.textContent = state.courses.length;
  selectors.examCount.textContent = state.exams.length;
  selectors.enrollmentCount.textContent = state.enrollments.length;
  selectors.departmentCount.textContent = state.departments.length;
  selectors.facultyCount.textContent = state.faculty.length;
  selectors.employeeCount.textContent = state.employees.length;
  selectors.financeCount.textContent = state.finances.length;
  selectors.infrastructureCount.textContent = state.infrastructure.length;
  selectors.testingCount.textContent = state.testing.length;
  selectors.deploymentCount.textContent = state.deployments.length;
  selectors.trainingCount.textContent = state.training.length;
  selectors.alumniCount.textContent = state.alumni.length;
};

const renderTable = (items, container, mapper) => {
  container.innerHTML = items.map(mapper).join("");
};

const renderTables = () => {
  renderTable(state.students, selectors.studentTable, student => `
    <tr>
      <td>${student.name}</td>
      <td>${student.email}</td>
      <td>${student.program}</td>
      <td>${student.status}</td>
    </tr>
  `);

  renderTable(state.courses, selectors.courseTable, course => `
    <tr>
      <td>${course.title}</td>
      <td>${course.code}</td>
      <td>${course.department}</td>
      <td>${course.credits}</td>
    </tr>
  `);

  renderTable(state.enrollments, selectors.enrollmentTable, enrollment => `
    <tr>
      <td>${enrollment.student_name}</td>
      <td>${enrollment.course_title}</td>
      <td>${enrollment.status}</td>
      <td>${enrollment.grade || "—"}</td>
    </tr>
  `);

  renderTable(state.exams, selectors.examTable, exam => `
    <tr>
      <td>${exam.exam_name}</td>
      <td>${exam.course_title}</td>
      <td>${new Date(exam.exam_date).toLocaleDateString()}</td>
      <td>${exam.total_marks}</td>
      <td>${exam.passing_marks}</td>
    </tr>
  `);

  renderTable(state.examResults, selectors.examResultTable, result => `
    <tr>
      <td>${result.student_name}</td>
      <td>${result.exam_name}</td>
      <td>${result.course_title}</td>
      <td>${result.score}</td>
      <td>${result.grade}</td>
    </tr>
  `);

  renderTable(state.departments, selectors.departmentTable, dept => `
    <tr>
      <td>${dept.name}</td>
      <td>${dept.head}</td>
      <td>${dept.building}</td>
    </tr>
  `);

  renderTable(state.finances, selectors.financeTable, finance => `
    <tr>
      <td>${finance.item_name}</td>
      <td>${finance.department}</td>
      <td>${Number(finance.amount_allocated).toLocaleString()}</td>
      <td>${Number(finance.amount_used).toLocaleString()}</td>
      <td>${finance.period}</td>
      <td>${finance.status}</td>
    </tr>
  `);

  renderTable(state.infrastructure, selectors.infrastructureTable, asset => `
    <tr>
      <td>${asset.asset_name}</td>
      <td>${asset.category}</td>
      <td>${asset.location}</td>
      <td>${asset.condition}</td>
      <td>${new Date(asset.last_maintenance).toLocaleDateString()}</td>
      <td>${new Date(asset.next_maintenance).toLocaleDateString()}</td>
      <td>${Number(asset.value).toLocaleString()}</td>
      <td>${asset.responsible}</td>
    </tr>
  `);

  renderTable(state.testing, selectors.testingTable, test => `
    <tr>
      <td>${test.project_name}</td>
      <td>${test.category}</td>
      <td>${test.environment}</td>
      <td>${new Date(test.start_date).toLocaleDateString()}</td>
      <td>${test.end_date ? new Date(test.end_date).toLocaleDateString() : "—"}</td>
      <td>${test.status}</td>
      <td>${test.result_summary || "—"}</td>
    </tr>
  `);

  renderTable(state.deployments, selectors.deploymentTable, deploy => `
    <tr>
      <td>${deploy.system_name}</td>
      <td>${deploy.deployment_type}</td>
      <td>${deploy.target_environment}</td>
      <td>${deploy.deployed_by}</td>
      <td>${new Date(deploy.deploy_date).toLocaleDateString()}</td>
      <td>${deploy.status}</td>
      <td>${deploy.notes || "—"}</td>
    </tr>
  `);

  renderTable(state.training, selectors.trainingTable, program => `
    <tr>
      <td>${program.program_name}</td>
      <td>${program.audience}</td>
      <td>${program.trainer}</td>
      <td>${new Date(program.start_date).toLocaleDateString()}</td>
      <td>${new Date(program.end_date).toLocaleDateString()}</td>
      <td>${program.location}</td>
      <td>${program.status}</td>
    </tr>
  `);

  renderTable(state.alumni, selectors.alumniTable, alum => `
    <tr>
      <td>${alum.name}</td>
      <td>${alum.program}</td>
      <td>${alum.degree}</td>
      <td>${alum.graduation_year}</td>
      <td>${alum.employer || "—"}</td>
      <td>${alum.contact_email || "—"}</td>
      <td>${alum.status}</td>
    </tr>
  `);

  renderTable(state.employees, selectors.employeeTable, employee => `
    <tr>
      <td>${employee.name}</td>
      <td>${employee.role}</td>
      <td>${employee.department}</td>
      <td>${employee.email}</td>
      <td>${new Date(employee.hire_date).toLocaleDateString()}</td>
      <td>${employee.status}</td>
      <td>${Number(employee.salary).toLocaleString()}</td>
    </tr>
  `);

  renderTable(state.faculty, selectors.facultyTable, member => `
    <tr>
      <td>${member.name}</td>
      <td>${member.title}</td>
      <td>${member.department}</td>
      <td>${member.email}</td>
      <td>${new Date(member.hire_date).toLocaleDateString()}</td>
      <td>${member.status}</td>
      <td>${Number(member.salary).toLocaleString()}</td>
    </tr>
  `);
};

const setAuthState = (user, token) => {
  auth.user = user;
  auth.token = token;
  saveAuth();
  updateAuthUI();
};

const setError = message => {
  selectors.authError.textContent = message || "";
};

const updateAuthUI = () => {
  const signedIn = Boolean(auth.user);
  selectors.appShell.classList.toggle("hidden", !signedIn);
  selectors.authScreen.classList.toggle("hidden", signedIn);
  selectors.currentUser.textContent = signedIn ? `Welcome, ${auth.user.full_name}` : "";

  if (!signedIn) {
    selectors.loginForm.classList.remove("hidden");
    selectors.registerForm.classList.add("hidden");
    selectors.authTitle.textContent = "Sign in to UniManage";
    selectors.authPrompt.textContent = "New to UniManage?";
    selectors.toggleAuth.textContent = "Create an account";
  }
};

const toggleAuthMode = () => {
  const showingLogin = !selectors.loginForm.classList.contains("hidden");
  if (showingLogin) {
    selectors.loginForm.classList.add("hidden");
    selectors.registerForm.classList.remove("hidden");
    selectors.authTitle.textContent = "Create an account";
    selectors.authPrompt.textContent = "Already have an account?";
    selectors.toggleAuth.textContent = "Sign in";
  } else {
    selectors.loginForm.classList.remove("hidden");
    selectors.registerForm.classList.add("hidden");
    selectors.authTitle.textContent = "Sign in to UniManage";
    selectors.authPrompt.textContent = "New to UniManage?";
    selectors.toggleAuth.textContent = "Create an account";
  }
  setError("");
};

const handleLogin = async (event) => {
  event.preventDefault();
  setError("");

  const formData = new FormData(selectors.loginForm);
  const email = formData.get("email").trim();
  const password = formData.get("password").trim();

  if (!email || !password) {
    setError("Please enter both email and password.");
    return;
  }

  try {
    const response = await authFetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();
    setAuthState(payload.user, payload.token);
    await refreshData();
  } catch (error) {
    setError(error.message);
  }
};

const handleRegister = async (event) => {
  event.preventDefault();
  setError("");

  const formData = new FormData(selectors.registerForm);
  const full_name = formData.get("full_name").trim();
  const email = formData.get("email").trim();
  const password = formData.get("password").trim();

  if (!full_name || !email || !password) {
    setError("Please fill all registration fields.");
    return;
  }

  try {
    const response = await authFetch(`${apiBase}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, password }),
    });

    const payload = await response.json();
    setAuthState(payload.user, payload.token);
    await refreshData();
  } catch (error) {
    setError(error.message);
  }
};

const handleLogout = async () => {
  if (auth.token) {
    await authFetch(`${apiBase}/auth/logout`, { method: "POST" }).catch(() => {});
  }
  auth.token = null;
  auth.user = null;
  saveAuth();
  updateAuthUI();
};

const checkSession = async () => {
  if (!auth.token) {
    updateAuthUI();
    return;
  }

  try {
    const response = await authFetch(`${apiBase}/auth/me`);
    auth.user = await response.json();
    saveAuth();
    updateAuthUI();
    await refreshData();
  } catch {
    auth.token = null;
    auth.user = null;
    saveAuth();
    updateAuthUI();
  }
};

const loadState = async () => {
  const [students, courses, exams, examResults, departments, faculty, employees, finances, infrastructure, testing, deployments, training, alumni, enrollments] = await Promise.all([
    fetchEntity("students"),
    fetchEntity("courses"),
    fetchEntity("exams"),
    fetchEntity("exam_results"),
    fetchEntity("departments"),
    fetchEntity("faculty"),
    fetchEntity("employees"),
    fetchEntity("finances"),
    fetchEntity("infrastructure"),
    fetchEntity("testing"),
    fetchEntity("deployments"),
    fetchEntity("training"),
    fetchEntity("alumni"),
    fetchEntity("enrollments"),
  ]);
  Object.assign(state, { students, courses, exams, examResults, departments, faculty, employees, finances, infrastructure, alumni, enrollments });
};

const openModal = (title, fields, onSubmit) => {
  selectors.modalTitle.textContent = title;
  selectors.formFields.innerHTML = fields.map(field => `
    <label>
      <span>${field.label}</span>
      ${field.element}
    </label>
  `).join("");

  selectors.entityForm.onsubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(selectors.entityForm);
    const payload = {};
    fields.forEach(field => {
      const rawValue = formData.get(field.name);
      const value = rawValue === null ? "" : String(rawValue).trim();
      payload[field.name] = value === "" ? null : (field.type === "number" ? Number(value) : value);
    });

    try {
      await onSubmit(payload);
      await refreshData();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }

    closeModal();
  };

  selectors.modal.classList.add("show");
};

const closeModal = () => {
  selectors.modal.classList.remove("show");
  selectors.entityForm.reset();
};

const showStudentForm = () => {
  openModal("Add Student", [
    { label: "Full Name", name: "name", element: `<input name="name" required />` },
    { label: "Email", name: "email", element: `<input name="email" type="email" required />` },
    { label: "Program", name: "program", element: `<input name="program" required />` },
    { label: "Status", name: "status", element: `<select name="status">
        <option>Active</option><option>On Leave</option><option>Graduated</option>
      </select>` },
  ], values => postEntity("students", values));
};

const showCourseForm = () => {
  openModal("Add Course", [
    { label: "Course Title", name: "title", element: `<input name="title" required />` },
    { label: "Course Code", name: "code", element: `<input name="code" required />` },
    { label: "Department", name: "department", element: `<input name="department" required />` },
    { label: "Credits", name: "credits", element: `<input name="credits" type="number" min="1" max="6" value="3" required />` },
  ], values => postEntity("courses", values));
};

const showDepartmentForm = () => {
  openModal("Add Department", [
    { label: "Department Name", name: "name", element: `<input name="name" required />` },
    { label: "Department Head", name: "head", element: `<input name="head" required />` },
    { label: "Building", name: "building", element: `<input name="building" required />` },
  ], values => postEntity("departments", values));
};

const showFacultyForm = () => {
  openModal("Add Faculty", [
    { label: "Full Name", name: "name", element: `<input name="name" required />` },
    { label: "Title", name: "title", element: `<input name="title" required />` },
    { label: "Department", name: "department", element: `<input name="department" required />` },
    { label: "Email", name: "email", element: `<input name="email" type="email" required />` },
    { label: "Hire Date", name: "hire_date", element: `<input type="date" name="hire_date" required />` },
    { label: "Status", name: "status", element: `<select name="status"><option>Active</option><option>On Leave</option><option>Retired</option></select>` },
    { label: "Salary", name: "salary", element: `<input type="number" name="salary" min="0" step="0.01" required />`, type: "number" },
  ], values => postEntity("faculty", values));
};

const showEmployeeForm = () => {
  openModal("Add HR Record", [
    { label: "Full Name", name: "name", element: `<input name="name" required />` },
    { label: "Role", name: "role", element: `<input name="role" required />` },
    { label: "Department", name: "department", element: `<input name="department" required />` },
    { label: "Email", name: "email", element: `<input name="email" type="email" required />` },
    { label: "Hire Date", name: "hire_date", element: `<input type="date" name="hire_date" required />` },
    { label: "Status", name: "status", element: `<select name="status"><option>Active</option><option>On Leave</option><option>Resigned</option></select>` },
    { label: "Salary", name: "salary", element: `<input type="number" name="salary" min="0" step="0.01" required />`, type: "number" },
  ], values => postEntity("employees", values));
};

const showFinanceForm = () => {
  openModal("Add Finance Item", [
    { label: "Item Name", name: "item_name", element: `<input name="item_name" required />` },
    { label: "Department", name: "department", element: `<input name="department" required />` },
    { label: "Amount Allocated", name: "amount_allocated", element: `<input type="number" name="amount_allocated" min="0" step="0.01" required />`, type: "number" },
    { label: "Amount Used", name: "amount_used", element: `<input type="number" name="amount_used" min="0" step="0.01" required />`, type: "number" },
    { label: "Period", name: "period", element: `<input name="period" required />` },
    { label: "Status", name: "status", element: `<select name="status"><option>Active</option><option>Approved</option><option>Completed</option></select>` },
  ], values => postEntity("finances", values));
};

const showInfrastructureForm = () => {
  openModal("Add Infrastructure Asset", [
    { label: "Asset Name", name: "asset_name", element: `<input name="asset_name" required />` },
    { label: "Category", name: "category", element: `<input name="category" required />` },
    { label: "Location", name: "location", element: `<input name="location" required />` },
    { label: "Condition", name: "condition", element: `<select name="condition"><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option></select>` },
    { label: "Last Maintenance", name: "last_maintenance", element: `<input type="date" name="last_maintenance" required />` },
    { label: "Next Maintenance", name: "next_maintenance", element: `<input type="date" name="next_maintenance" required />` },
    { label: "Value", name: "value", element: `<input type="number" name="value" min="0" step="0.01" required />`, type: "number" },
    { label: "Responsible", name: "responsible", element: `<input name="responsible" required />` },
  ], values => postEntity("infrastructure", values));
};

const showAlumniForm = () => {
  const studentOptions = state.students.map(student => `<option value="${student.id}">${student.name}</option>`).join("");

  openModal("Add Alumni Record", [
    { label: "Linked Student", name: "student_id", element: `<select name="student_id"><option value="">None</option>${studentOptions}</select>` },
    { label: "Name", name: "name", element: `<input name="name" required />` },
    { label: "Program", name: "program", element: `<input name="program" required />` },
    { label: "Degree", name: "degree", element: `<input name="degree" required />` },
    { label: "Graduation Year", name: "graduation_year", element: `<input type="number" name="graduation_year" min="1900" max="2100" value="2025" required />`, type: "number" },
    { label: "Employer", name: "employer", element: `<input name="employer" placeholder="Optional" />` },
    { label: "Contact Email", name: "contact_email", element: `<input name="contact_email" type="email" placeholder="Optional" />` },
    { label: "Status", name: "status", element: `<select name="status"><option>Alumni</option><option>Employed</option><option>Further Study</option><option>Entrepreneur</option></select>` },
  ], values => postEntity("alumni", values));
};

const showTestingForm = () => {
  openModal("Add Testing Project", [
    { label: "Project Name", name: "project_name", element: `<input name="project_name" required />` },
    { label: "Category", name: "category", element: `<input name="category" required />` },
    { label: "Environment", name: "environment", element: `<input name="environment" required />` },
    { label: "Status", name: "status", element: `<select name="status"><option>Planned</option><option>In Progress</option><option>Completed</option><option>Blocked</option></select>` },
    { label: "Start Date", name: "start_date", element: `<input type="date" name="start_date" required />` },
    { label: "End Date", name: "end_date", element: `<input type="date" name="end_date" />` },
    { label: "Result Summary", name: "result_summary", element: `<input name="result_summary" placeholder="Optional" />` },
  ], values => postEntity("testing", values));
};

const showDeploymentForm = () => {
  openModal("Add Deployment", [
    { label: "System", name: "system_name", element: `<input name="system_name" required />` },
    { label: "Deployment Type", name: "deployment_type", element: `<input name="deployment_type" required />` },
    { label: "Target Environment", name: "target_environment", element: `<input name="target_environment" required />` },
    { label: "Deployed By", name: "deployed_by", element: `<input name="deployed_by" required />` },
    { label: "Deploy Date", name: "deploy_date", element: `<input type="date" name="deploy_date" required />` },
    { label: "Status", name: "status", element: `<select name="status"><option>Planned</option><option>In Progress</option><option>Completed</option><option>Rolled Back</option></select>` },
    { label: "Notes", name: "notes", element: `<input name="notes" placeholder="Optional" />` },
  ], values => postEntity("deployments", values));
};

const showTrainingForm = () => {
  openModal("Add Training Program", [
    { label: "Program Name", name: "program_name", element: `<input name="program_name" required />` },
    { label: "Audience", name: "audience", element: `<input name="audience" required />` },
    { label: "Trainer", name: "trainer", element: `<input name="trainer" required />` },
    { label: "Start Date", name: "start_date", element: `<input type="date" name="start_date" required />` },
    { label: "End Date", name: "end_date", element: `<input type="date" name="end_date" required />` },
    { label: "Location", name: "location", element: `<input name="location" required />` },
    { label: "Status", name: "status", element: `<select name="status"><option>Planned</option><option>Scheduled</option><option>Completed</option></select>` },
  ], values => postEntity("training", values));
};

const showEnrollmentForm = () => {
  const studentOptions = state.students.map(student => `<option value="${student.id}">${student.name}</option>`).join("");
  const courseOptions = state.courses.map(course => `<option value="${course.id}">${course.title}</option>`).join("");

  openModal("Enroll Student", [
    { label: "Student", name: "student_id", element: `<select name="student_id" required>${studentOptions}</select>` },
    { label: "Course", name: "course_id", element: `<select name="course_id" required>${courseOptions}</select>` },
    { label: "Status", name: "status", element: `<select name="status">
        <option>Enrolled</option><option>Waitlisted</option><option>Completed</option>
      </select>` },
    { label: "Grade", name: "grade", element: `<input name="grade" placeholder="Optional" />` },
  ], values => postEntity("enrollments", values));
};

const showExamForm = () => {
  const courseOptions = state.courses.map(course => `<option value="${course.id}">${course.title}</option>`).join("");

  openModal("Add Exam", [
    { label: "Exam Name", name: "exam_name", element: `<input name="exam_name" required />` },
    { label: "Course", name: "course_id", element: `<select name="course_id" required>${courseOptions}</select>` },
    { label: "Exam Date", name: "exam_date", element: `<input type="date" name="exam_date" required />` },
    { label: "Total Marks", name: "total_marks", element: `<input type="number" name="total_marks" min="1" value="100" required />` },
    { label: "Passing Marks", name: "passing_marks", element: `<input type="number" name="passing_marks" min="1" value="40" required />` },
  ], values => postEntity("exams", values));
};

const showExamResultForm = () => {
  const examOptions = state.exams.map(exam => `<option value="${exam.id}">${exam.exam_name} — ${exam.course_title}</option>`).join("");
  const enrollmentOptions = state.enrollments.map(enroll => `<option value="${enroll.id}">${enroll.student_name} — ${enroll.course_title}</option>`).join("");

  openModal("Record Exam Result", [
    { label: "Exam", name: "exam_id", element: `<select name="exam_id" required>${examOptions}</select>` },
    { label: "Enrollment", name: "enrollment_id", element: `<select name="enrollment_id" required>${enrollmentOptions}</select>` },
    { label: "Score", name: "score", element: `<input type="number" name="score" min="0" required />` },
    { label: "Grade", name: "grade", element: `<input name="grade" placeholder="A+ / B / Pass" required />` },
    { label: "Remarks", name: "remarks", element: `<input name="remarks" placeholder="Optional comments" />` },
  ], values => postEntity("exam_results", values));
};

const filterItems = (items, query, keys) => {
  const lower = query.trim().toLowerCase();
  if (!lower) return items;
  return items.filter(item => keys.some(key => String(item[key] || "").toLowerCase().includes(lower)));
};

const addSearchHandlers = () => {
  selectors.studentSearch.addEventListener("input", () => {
    const visible = filterItems(state.students, selectors.studentSearch.value, ["name", "email", "program", "status"]);
    renderTable(visible, selectors.studentTable, student => `
      <tr>
        <td>${student.name}</td>
        <td>${student.email}</td>
        <td>${student.program}</td>
        <td>${student.status}</td>
      </tr>
    `);
  });

  selectors.courseSearch.addEventListener("input", () => {
    const visible = filterItems(state.courses, selectors.courseSearch.value, ["title", "code", "department"]);
    renderTable(visible, selectors.courseTable, course => `
      <tr>
        <td>${course.title}</td>
        <td>${course.code}</td>
        <td>${course.department}</td>
        <td>${course.credits}</td>
      </tr>
    `);
  });

  selectors.departmentSearch.addEventListener("input", () => {
    const visible = filterItems(state.departments, selectors.departmentSearch.value, ["name", "head", "building"]);
    renderTable(visible, selectors.departmentTable, dept => `
      <tr>
        <td>${dept.name}</td>
        <td>${dept.head}</td>
        <td>${dept.building}</td>
      </tr>
    `);
  });

  selectors.facultySearch.addEventListener("input", () => {
    const visible = filterItems(state.faculty, selectors.facultySearch.value, ["name", "title", "department", "email", "status", "hire_date", "salary"]);
    renderTable(visible, selectors.facultyTable, member => `
      <tr>
        <td>${member.name}</td>
        <td>${member.title}</td>
        <td>${member.department}</td>
        <td>${member.email}</td>
        <td>${new Date(member.hire_date).toLocaleDateString()}</td>
        <td>${member.status}</td>
        <td>${Number(member.salary).toLocaleString()}</td>
      </tr>
    `);
  });

  selectors.employeeSearch.addEventListener("input", () => {
    const visible = filterItems(state.employees, selectors.employeeSearch.value, ["name", "role", "department", "email", "status", "responsible"]);
    renderTable(visible, selectors.employeeTable, employee => `
      <tr>
        <td>${employee.name}</td>
        <td>${employee.role}</td>
        <td>${employee.department}</td>
        <td>${employee.email}</td>
        <td>${new Date(employee.hire_date).toLocaleDateString()}</td>
        <td>${employee.status}</td>
        <td>${Number(employee.salary).toLocaleString()}</td>
      </tr>
    `);
  });

  selectors.financeSearch.addEventListener("input", () => {
    const visible = filterItems(state.finances, selectors.financeSearch.value, ["item_name", "department", "period", "status"]);
    renderTable(visible, selectors.financeTable, finance => `
      <tr>
        <td>${finance.item_name}</td>
        <td>${finance.department}</td>
        <td>${Number(finance.amount_allocated).toLocaleString()}</td>
        <td>${Number(finance.amount_used).toLocaleString()}</td>
        <td>${finance.period}</td>
        <td>${finance.status}</td>
      </tr>
    `);
  });

  selectors.infrastructureSearch.addEventListener("input", () => {
    const visible = filterItems(state.infrastructure, selectors.infrastructureSearch.value, ["asset_name", "category", "location", "condition", "responsible"]);
    renderTable(visible, selectors.infrastructureTable, asset => `
      <tr>
        <td>${asset.asset_name}</td>
        <td>${asset.category}</td>
        <td>${asset.location}</td>
        <td>${asset.condition}</td>
        <td>${new Date(asset.last_maintenance).toLocaleDateString()}</td>
        <td>${new Date(asset.next_maintenance).toLocaleDateString()}</td>
        <td>${Number(asset.value).toLocaleString()}</td>
        <td>${asset.responsible}</td>
      </tr>
    `);
  });

  selectors.testingSearch.addEventListener("input", () => {
    const visible = filterItems(state.testing, selectors.testingSearch.value, ["project_name", "category", "environment", "status", "result_summary"]);
    renderTable(visible, selectors.testingTable, test => `
      <tr>
        <td>${test.project_name}</td>
        <td>${test.category}</td>
        <td>${test.environment}</td>
        <td>${new Date(test.start_date).toLocaleDateString()}</td>
        <td>${test.end_date ? new Date(test.end_date).toLocaleDateString() : "—"}</td>
        <td>${test.status}</td>
        <td>${test.result_summary || "—"}</td>
      </tr>
    `);
  });

  selectors.deploymentSearch.addEventListener("input", () => {
    const visible = filterItems(state.deployments, selectors.deploymentSearch.value, ["system_name", "deployment_type", "target_environment", "deployed_by", "status", "notes"]);
    renderTable(visible, selectors.deploymentTable, deploy => `
      <tr>
        <td>${deploy.system_name}</td>
        <td>${deploy.deployment_type}</td>
        <td>${deploy.target_environment}</td>
        <td>${deploy.deployed_by}</td>
        <td>${new Date(deploy.deploy_date).toLocaleDateString()}</td>
        <td>${deploy.status}</td>
        <td>${deploy.notes || "—"}</td>
      </tr>
    `);
  });

  selectors.trainingSearch.addEventListener("input", () => {
    const visible = filterItems(state.training, selectors.trainingSearch.value, ["program_name", "audience", "trainer", "location", "status"]);
    renderTable(visible, selectors.trainingTable, program => `
      <tr>
        <td>${program.program_name}</td>
        <td>${program.audience}</td>
        <td>${program.trainer}</td>
        <td>${new Date(program.start_date).toLocaleDateString()}</td>
        <td>${new Date(program.end_date).toLocaleDateString()}</td>
        <td>${program.location}</td>
        <td>${program.status}</td>
      </tr>
    `);
  });

  selectors.alumniSearch.addEventListener("input", () => {
    const visible = filterItems(state.alumni, selectors.alumniSearch.value, ["name", "program", "degree", "employer", "contact_email", "status"]);
    renderTable(visible, selectors.alumniTable, alum => `
      <tr>
        <td>${alum.name}</td>
        <td>${alum.program}</td>
        <td>${alum.degree}</td>
        <td>${alum.graduation_year}</td>
        <td>${alum.employer || "—"}</td>
        <td>${alum.contact_email || "—"}</td>
        <td>${alum.status}</td>
      </tr>
    `);
  });

  selectors.enrollmentSearch.addEventListener("input", () => {
    const visible = filterItems(state.enrollments, selectors.enrollmentSearch.value, ["student_name", "course_title", "status", "grade"]);
    renderTable(visible, selectors.enrollmentTable, enrollment => `
      <tr>
        <td>${enrollment.student_name}</td>
        <td>${enrollment.course_title}</td>
        <td>${enrollment.status}</td>
        <td>${enrollment.grade || "—"}</td>
      </tr>
    `);
  });

  selectors.examSearch.addEventListener("input", () => {
    const visible = filterItems(state.exams, selectors.examSearch.value, ["exam_name", "course_title"]);
    renderTable(visible, selectors.examTable, exam => `
      <tr>
        <td>${exam.exam_name}</td>
        <td>${exam.course_title}</td>
        <td>${new Date(exam.exam_date).toLocaleDateString()}</td>
        <td>${exam.total_marks}</td>
        <td>${exam.passing_marks}</td>
      </tr>
    `);
  });

  selectors.examResultSearch.addEventListener("input", () => {
    const visible = filterItems(state.examResults, selectors.examResultSearch.value, ["student_name", "exam_name", "course_title", "grade"]);
    renderTable(visible, selectors.examResultTable, result => `
      <tr>
        <td>${result.student_name}</td>
        <td>${result.exam_name}</td>
        <td>${result.course_title}</td>
        <td>${result.score}</td>
        <td>${result.grade}</td>
      </tr>
    `);
  });
};

const attachEvents = () => {
  selectors.addStudentBtn.addEventListener("click", showStudentForm);
  selectors.addCourseBtn.addEventListener("click", showCourseForm);
  selectors.addExamBtn.addEventListener("click", showExamForm);
  selectors.addExamResultBtn.addEventListener("click", showExamResultForm);
  selectors.addEnrollmentBtn.addEventListener("click", showEnrollmentForm);
  selectors.addDepartmentBtn.addEventListener("click", showDepartmentForm);
  selectors.addEmployeeBtn.addEventListener("click", showEmployeeForm);
  selectors.addFinanceBtn.addEventListener("click", showFinanceForm);
  selectors.addInfrastructureBtn.addEventListener("click", showInfrastructureForm);
  selectors.addTestingBtn.addEventListener("click", showTestingForm);
  selectors.addDeploymentBtn.addEventListener("click", showDeploymentForm);
  selectors.addTrainingBtn.addEventListener("click", showTrainingForm);
  selectors.addAlumniBtn.addEventListener("click", showAlumniForm);
  selectors.addFacultyBtn.addEventListener("click", showFacultyForm);
  selectors.closeModal.addEventListener("click", closeModal);
  selectors.cancelForm.addEventListener("click", closeModal);
  selectors.modal.addEventListener("click", event => {
    if (event.target === selectors.modal) closeModal();
  });

  selectors.loginForm.addEventListener("submit", handleLogin);
  selectors.registerForm.addEventListener("submit", handleRegister);
  selectors.toggleAuth.addEventListener("click", toggleAuthMode);
  selectors.logoutBtn.addEventListener("click", handleLogout);
};

const refreshData = async () => {
  await loadState();
  renderTables();
  updateStats();
};

const init = async () => {
  loadAuth();
  updateAuthUI();
  await checkSession();
  attachEvents();
  addSearchHandlers();
};

const startApp = async () => {
  try {
    await init();
  } catch (error) {
    console.error("App initialization failed:", error);
    setError("Unable to load the app. Please refresh the page.");
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
