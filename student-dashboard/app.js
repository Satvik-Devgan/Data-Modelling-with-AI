const student = {
  name: "Satvik Devgan",
  semester: "Semester 5",
  program: "B.Tech CSE",
  cgpa: 8.64,
  maxCgpa: 10,
  attendance: 87,
  classesHeld: 142,
  classesAttended: 124,
};

const weekItems = [
  { title: "Data Modelling lab", when: "Thu · 10:00" },
  { title: "OS tutorial", when: "Fri · 14:00" },
  { title: "Hackathon briefing", when: "Sat · 11:00" },
];

const courses = [
  { code: "CS501", name: "Data Modelling", credits: 4, faculty: "Dr. Rao" },
  { code: "CS503", name: "Operating Systems", credits: 4, faculty: "Prof. Iyer" },
  { code: "CS505", name: "Computer Networks", credits: 3, faculty: "Dr. Banerjee" },
  { code: "HS510", name: "Technical Writing", credits: 2, faculty: "Ms. Kapoor" },
];

const assignments = [
  { title: "ER diagram + schema", course: "CS501", due: "28 Aug", status: "pending" },
  { title: "Process scheduling report", course: "CS503", due: "30 Aug", status: "pending" },
  { title: "Subnetting worksheet", course: "CS505", due: "22 Aug", status: "submitted" },
  { title: "Lab abstract", course: "HS510", due: "18 Aug", status: "overdue" },
];

const views = ["dashboard", "courses", "assignments", "studyplan"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLAN_KEY = "campus-hub-study-plan";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadPlan() {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePlan() {
  localStorage.setItem(PLAN_KEY, JSON.stringify(studyPlan));
}

let studyPlan = loadPlan();
let editingPlanId = null;

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function attendanceTone(percent) {
  if (percent >= 75) return { label: "On track", className: "" };
  if (percent >= 65) return { label: "At risk", className: "warn" };
  return { label: "Low", className: "danger" };
}

function renderProfile() {
  document.getElementById("studentName").textContent = student.name;
  document.getElementById("semesterLabel").textContent = student.semester;
  document.getElementById("programChip").textContent = student.program;
  document.getElementById("avatar").textContent = initials(student.name);
}

function renderAttendance() {
  const tone = attendanceTone(student.attendance);
  const badge = document.getElementById("attendanceBadge");
  const fill = document.getElementById("attendanceFill");
  const bar = document.getElementById("attendanceBar");

  document.getElementById("attendanceValue").textContent = `${student.attendance}%`;
  document.getElementById("attendanceSub").textContent =
    `${student.classesAttended} of ${student.classesHeld} classes attended`;
  badge.textContent = tone.label;
  badge.className = `badge ${tone.className}`.trim();
  fill.style.width = `${student.attendance}%`;
  bar.setAttribute("aria-valuenow", String(student.attendance));
  bar.setAttribute("aria-label", `Attendance ${student.attendance} percent`);

  document.getElementById("attendanceLegend").innerHTML = `
    <li>Required: 75%</li>
    <li>Current: ${student.attendance}%</li>
  `;
}

function renderCgpa() {
  const percent = (student.cgpa / student.maxCgpa) * 100;
  document.getElementById("cgpaValue").textContent = student.cgpa.toFixed(2);
  document.getElementById("cgpaSub").textContent =
    `Out of ${student.maxCgpa.toFixed(1)} · ${student.semester}`;
  document.getElementById("cgpaFill").style.width = `${percent}%`;
  document.getElementById("cgpaMarker").style.left = `${percent}%`;
}

function renderLists() {
  document.getElementById("weekList").innerHTML = weekItems
    .map(
      (item) => `
        <li>
          <span>${item.title}</span>
          <span class="muted">${item.when}</span>
        </li>
      `
    )
    .join("");

  document.getElementById("deadlinePreview").innerHTML = assignments
    .filter((item) => item.status !== "submitted")
    .map(
      (item) => `
        <li>
          <span>${item.title}</span>
          <span class="muted">${item.due}</span>
        </li>
      `
    )
    .join("");

  document.getElementById("courseGrid").innerHTML = courses
    .map(
      (course) => `
        <article class="card">
          <p class="eyebrow">${course.code}</p>
          <h3>${course.name}</h3>
          <div class="course-meta">
            <span>${course.faculty}</span>
            <span class="credits">${course.credits} credits</span>
          </div>
        </article>
      `
    )
    .join("");

  document.getElementById("assignmentBody").innerHTML = assignments
    .map(
      (item) => `
        <tr>
          <td>${item.title}</td>
          <td>${item.course}</td>
          <td>${item.due}</td>
          <td><span class="status ${item.status}">${item.status}</span></td>
        </tr>
      `
    )
    .join("");

  renderTodayPlan();
}

function todayName() {
  return DAYS[(new Date().getDay() + 6) % 7];
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function durationLabel(start, end) {
  const minutes = timeToMinutes(end) - timeToMinutes(start);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${rest}m`;
}

function sortedPlan() {
  return [...studyPlan].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return timeToMinutes(a.start) - timeToMinutes(b.start);
  });
}

function renderTodayPlan() {
  const today = todayName();
  const items = sortedPlan().filter((item) => item.day === today);
  const list = document.getElementById("todayPlanList");

  if (!items.length) {
    list.innerHTML = `<li><span>No sessions for ${today} yet.</span><span class="muted">Add one in Study Plan</span></li>`;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
        <li>
          <span>${escapeHtml(item.subject)} · ${escapeHtml(item.topic)}</span>
          <span class="muted">${formatTime(item.start)}–${formatTime(item.end)}${item.done ? " · done" : ""}</span>
        </li>
      `
    )
    .join("");
}

function fillPlanSelects() {
  const subjectOptions = [
    ...courses.map((course) => `<option value="${escapeHtml(course.name)}">${escapeHtml(course.code)} · ${escapeHtml(course.name)}</option>`),
    `<option value="Other">Other</option>`,
  ].join("");

  const dayOptions = DAYS.map((day) => `<option value="${day}">${day}</option>`).join("");
  const filterOptions = [`<option value="all">All days</option>`]
    .concat(DAYS.map((day) => `<option value="${day}">${day}</option>`))
    .join("");

  document.getElementById("planSubject").innerHTML = subjectOptions;
  document.getElementById("planDay").innerHTML = dayOptions;
  document.getElementById("planFilter").innerHTML = filterOptions;
}

function renderStudyPlan() {
  const filter = document.getElementById("planFilter").value;
  const items = sortedPlan().filter((item) => filter === "all" || item.day === filter);
  const list = document.getElementById("planList");
  const doneCount = items.filter((item) => item.done).length;

  document.getElementById("planCount").textContent = items.length
    ? `${items.length} session${items.length === 1 ? "" : "s"} · ${doneCount} done`
    : "No sessions yet";

  if (!items.length) {
    list.innerHTML = `<p class="empty-state card">Add a subject, topic, and time above. Your plan updates instantly and stays saved.</p>`;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
        <article class="card plan-card${item.done ? " is-done" : ""}" data-id="${escapeHtml(item.id)}">
          <div>
            <p class="eyebrow">${escapeHtml(item.day)}</p>
            <h3>${escapeHtml(item.subject)} — ${escapeHtml(item.topic)}</h3>
            <p class="plan-meta">
              <span>${formatTime(item.start)} – ${formatTime(item.end)}</span>
              <span>${durationLabel(item.start, item.end)}</span>
              ${item.notes ? `<span>${escapeHtml(item.notes)}</span>` : ""}
            </p>
          </div>
          <div class="plan-actions">
            <button class="btn-icon" type="button" data-action="toggle">${item.done ? "Undo" : "Done"}</button>
            <button class="btn-icon" type="button" data-action="edit">Edit</button>
            <button class="btn-icon danger" type="button" data-action="delete">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function showPlanError(message) {
  const error = document.getElementById("planError");
  error.hidden = !message;
  error.textContent = message || "";
}

function resetPlanForm() {
  editingPlanId = null;
  document.getElementById("planForm").reset();
  document.getElementById("planId").value = "";
  document.getElementById("planSubmit").textContent = "Add session";
  document.getElementById("planCancel").hidden = true;
  showPlanError("");
}

function startEditPlan(id) {
  const item = studyPlan.find((entry) => entry.id === id);
  if (!item) return;

  editingPlanId = id;
  document.getElementById("planId").value = id;
  document.getElementById("planSubject").value = item.subject;
  document.getElementById("planTopic").value = item.topic;
  document.getElementById("planDay").value = item.day;
  document.getElementById("planStart").value = item.start;
  document.getElementById("planEnd").value = item.end;
  document.getElementById("planNotes").value = item.notes;
  document.getElementById("planSubmit").textContent = "Save changes";
  document.getElementById("planCancel").hidden = false;
  document.getElementById("planTopic").focus();
}

function handlePlanSubmit(event) {
  event.preventDefault();

  const subject = document.getElementById("planSubject").value.trim();
  const topic = document.getElementById("planTopic").value.trim();
  const day = document.getElementById("planDay").value;
  const start = document.getElementById("planStart").value;
  const end = document.getElementById("planEnd").value;
  const notes = document.getElementById("planNotes").value.trim();

  if (!subject || !topic || !day || !start || !end) {
    showPlanError("Fill in subject, topic, day, and both times.");
    return;
  }

  if (timeToMinutes(end) <= timeToMinutes(start)) {
    showPlanError("End time must be after start time.");
    return;
  }

  if (editingPlanId) {
    studyPlan = studyPlan.map((item) =>
      item.id === editingPlanId ? { ...item, subject, topic, day, start, end, notes } : item
    );
  } else {
    studyPlan.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
      subject,
      topic,
      day,
      start,
      end,
      notes,
      done: false,
    });
  }

  savePlan();
  resetPlanForm();
  renderStudyPlan();
  renderTodayPlan();
}

function handlePlanListClick(event) {
  const button = event.target.closest("button[data-action]");
  const card = event.target.closest(".plan-card");
  if (!button || !card) return;

  const id = card.dataset.id;
  const action = button.dataset.action;

  if (action === "delete") {
    studyPlan = studyPlan.filter((item) => item.id !== id);
    if (editingPlanId === id) resetPlanForm();
  }

  if (action === "toggle") {
    studyPlan = studyPlan.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
  }

  if (action === "edit") {
    startEditPlan(id);
    return;
  }

  savePlan();
  renderStudyPlan();
  renderTodayPlan();
}

function setView(viewName) {
  views.forEach((name) => {
    const section = document.getElementById(`view-${name}`);
    const isActive = name === viewName;
    section.hidden = !isActive;
    section.classList.toggle("is-visible", isActive);
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });

  closeSidebar();
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("is-open");
  document.getElementById("overlay").hidden = true;
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("is-open");
  document.getElementById("overlay").hidden = false;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.getElementById("menuBtn").addEventListener("click", openSidebar);
  document.getElementById("overlay").addEventListener("click", closeSidebar);

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) closeSidebar();
  });

  document.getElementById("planForm").addEventListener("submit", handlePlanSubmit);
  document.getElementById("planCancel").addEventListener("click", resetPlanForm);
  document.getElementById("planFilter").addEventListener("change", renderStudyPlan);
  document.getElementById("planList").addEventListener("click", handlePlanListClick);
}

fillPlanSelects();
renderProfile();
renderAttendance();
renderCgpa();
renderLists();
renderStudyPlan();
bindEvents();
