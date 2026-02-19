// 🔥 FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBBRXIzO-q2jr2DO0x16is9svF1JcnyrUY",
    authDomain: "task-manager-4123.firebaseapp.com",
    projectId: "task-manager-4123",
    storageBucket: "task-manager-4123.firebasestorage.app",
    messagingSenderId: "453964398356",
    appId: "1:453964398356:web:b535b442a3d14374aa4c01"
};

// 🔥 INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔔 Request notification permission
Notification.requestPermission();

// 🔹 Elements
const taskInput = document.getElementById("taskInput");
const dueDate = document.getElementById("dueDate");
const prioritySelect = document.getElementById("priority");
const taskList = document.getElementById("taskList");
const progressBar = document.getElementById("progressBar");
const stats = document.getElementById("stats");
const searchBox = document.getElementById("searchBox");
const themeBtn = document.getElementById("themeBtn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// 🔹 Save to local storage
function saveLocal() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// 🔹 Save to Firestore
async function saveToCloud() {
    const colRef = collection(db, "tasks");
    try {
        await addDoc(colRef, { tasks });
    } catch (e) {
        console.error("Error saving to Firestore:", e);
    }
}

// 🔹 Sort tasks by priority
function sortByPriority() {
    const order = { High: 1, Medium: 2, Low: 3 };
    tasks.sort((a, b) => order[a.priority] - order[b.priority]);
}

// 🔹 Add task
function addTask() {
    let text = taskInput.value.trim();
    let date = dueDate.value;
    let priority = prioritySelect.value;

    if (!text) return alert("Enter task!");

    tasks.push({ text, date, priority, done: false });

    sortByPriority();
    saveLocal();
    saveToCloud();
    displayTasks();

    taskInput.value = "";
    dueDate.value = "";
}

// 🔹 Display tasks
function displayTasks() {
    taskList.innerHTML = "";
    let done = 0;

    tasks.forEach((t, i) => {
        if (t.done) done++;

        let li = document.createElement("li");
        li.draggable = true;
        li.dataset.index = i;

        const today = new Date().toISOString().split("T")[0];

        li.innerHTML = `
            <b>${t.text}</b><br>
            Due: ${t.date || "No date"} 
            ${t.date ? `<br><small>${getCountdown(t.date)}</small>` : ""}<br>
            Priority: ${t.priority}<br>
            <button onclick="toggle(${i})">✔</button>
            <button onclick="removeTask(${i})">❌</button>
        `;

        if (t.done) li.classList.add("completed");
        li.classList.add(t.priority.toLowerCase());

        if (t.date && t.date < today && !t.done)
            li.classList.add("overdue");

        if (t.date === today && !t.done && Notification.permission === "granted") {
            new Notification("Task Due Today!", { body: t.text });
        }

        addDragEvents(li);
        taskList.appendChild(li);
    });

    updateProgress(done);
}

// 🔹 Countdown timer
function getCountdown(date) {
    const now = new Date();
    const due = new Date(date);
    const diff = due - now;

    if (diff <= 0) return "⛔ Overdue";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

    return `⏳ ${days}d ${hours}h remaining`;
}

// 🔹 Toggle done
function toggle(i) {
    tasks[i].done = !tasks[i].done;
    saveLocal();
    displayTasks();
}

// 🔹 Remove task
function removeTask(i) {
    tasks.splice(i, 1);
    saveLocal();
    displayTasks();
}

// 🔹 Update progress
function updateProgress(done) {
    let percent = tasks.length ? (done / tasks.length) * 100 : 0;
    progressBar.style.width = percent + "%";
    stats.innerText = `${done} / ${tasks.length} tasks completed`;
}

// 🔍 Search tasks
searchBox.addEventListener("keyup", function () {
    let filter = this.value.toLowerCase();
    document.querySelectorAll("li").forEach(li => {
        li.style.display = li.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
});

// 🌙 Dark mode
themeBtn.onclick = () => document.body.classList.toggle("dark");

// 📅 Calendar view
function toggleCalendar() {
    const cal = document.getElementById("calendarView");
    cal.style.display = cal.style.display === "block" ? "none" : "block";
    renderCalendar();
}

// Calendar render
function renderCalendar() {
    const cal = document.getElementById("calendarView");
    cal.innerHTML = "";

    const grouped = {};
    tasks.forEach(t => {
        if (!t.date) return;
        if (!grouped[t.date]) grouped[t.date] = [];
        grouped[t.date].push(t);
    });

    for (let date in grouped) {
        cal.innerHTML += `<h3>${date}</h3>`;
        grouped[date].forEach(t => {
            cal.innerHTML += `<div>• ${t.text} (${t.priority})</div>`;
        });
    }
}

// 🔥 Drag & Drop
let draggedIndex;
function addDragEvents(li) {
    li.addEventListener("dragstart", () => draggedIndex = li.dataset.index);
    li.addEventListener("dragover", e => e.preventDefault());
    li.addEventListener("drop", () => {
        let targetIndex = li.dataset.index;
        let temp = tasks[draggedIndex];
        tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, temp);
        saveLocal();
        displayTasks();
    });
}

// 🔹 Live countdown refresh
setInterval(displayTasks, 60000);

// 🔹 Expose functions globally for onclick
window.addTask = addTask;
window.toggleCalendar = toggleCalendar;
window.toggle = toggle;
window.removeTask = removeTask;

// 🔹 Initial display
displayTasks();
