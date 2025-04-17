let notes = [];
let notificationInterval;
let currentFilter = "all";

const notesContainer = document.getElementById("notesContainer");
const addNoteBtn = document.getElementById("addNoteBtn");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const noteForm = document.getElementById("noteForm");
const noteTitle = document.getElementById("noteTitle");
const noteDesc = document.getElementById("noteDesc");
const noteNotify = document.getElementById("noteNotify");
const noteCompleted = document.getElementById("noteCompleted");
const noteIdField = document.getElementById("noteId");
const modalTitle = document.getElementById("modalTitle");
const connectionStatus = document.getElementById("connectionStatus");
const refreshStatus = document.getElementById("refreshStatus");
const unsubscribeBtn = document.getElementById("unsubscribeBtn");
const enableNotificationsBtn = document.getElementById("enableNotificationsBtn");
const filterContainer = document.getElementById("filterContainer");

enableNotificationsBtn.addEventListener("click", () => {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      alert("Разрешение на уведомления получено!");
    } else {
      alert("Разрешение не получено. Уведомления работать не будут.");
    }
  });
});

function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    console.log("Отправка уведомления:", title, body);
    new Notification(title, { body });
  } else {
    console.log("Невозможно отправить уведомление – разрешение не получено.");
  }
}

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function loadNotes() {
  const stored = localStorage.getItem("notes");
  if (stored) {
    notes = JSON.parse(stored);
  }
}

function renderNotes() {
  notesContainer.innerHTML = "";
  let filteredNotes = [];
  if (currentFilter === "all") {
    filteredNotes = notes;
  } else if (currentFilter === "active") {
    filteredNotes = notes.filter(note => !note.completed);
  } else if (currentFilter === "completed") {
    filteredNotes = notes.filter(note => note.completed);
  }
  
  filteredNotes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";
    if (note.completed) {
      card.classList.add("completed");
    }
    
    const title = document.createElement("h3");
    title.textContent = note.title;
    const desc = document.createElement("p");
    desc.textContent = note.description;

    const toggleGroup = document.createElement("div");
    toggleGroup.className = "toggle-group";

    const notifyLabel = document.createElement("label");
    notifyLabel.innerHTML = `<input type="checkbox" ${note.notify ? "checked" : ""}> Уведомлять`;
    notifyLabel.querySelector("input").addEventListener("change", (e) => {
      note.notify = e.target.checked;
      saveNotes();
    });

    const completedLabel = document.createElement("label");
    completedLabel.innerHTML = `<input type="checkbox" ${note.completed ? "checked" : ""}> Выполнено`;
    completedLabel.querySelector("input").addEventListener("change", (e) => {
      note.completed = e.target.checked;
      if (note.completed) {
        note.notify = false;
      }
      saveNotes();
      renderNotes();
    });

    toggleGroup.append(notifyLabel, completedLabel);

    const actions = document.createElement("div");
    actions.className = "actions";
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn";
    editBtn.textContent = "Редактировать";
    editBtn.addEventListener("click", () => editNote(note.id));
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn";
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener("click", () => deleteNote(note.id));
    actions.append(editBtn, deleteBtn);

    card.append(title, desc, toggleGroup, actions);
    notesContainer.appendChild(card);
  });
}

function generateId() {
  return Date.now();
}

function openModal(editNoteData = null) {
  modal.style.display = "block";
  if (editNoteData) {
    modalTitle.textContent = "Редактировать заметку";
    noteTitle.value = editNoteData.title;
    noteDesc.value = editNoteData.description;
    noteNotify.checked = editNoteData.notify;
    noteCompleted.checked = editNoteData.completed;
    noteIdField.value = editNoteData.id;
  } else {
    modalTitle.textContent = "Новая заметка";
    noteTitle.value = "";
    noteDesc.value = "";
    noteNotify.checked = false;
    noteCompleted.checked = false;
    noteIdField.value = "";
  }
}

function closeModalWindow() {
  modal.style.display = "none";
}

noteForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = noteTitle.value;
  const description = noteDesc.value;
  const notify = noteNotify.checked;
  const completed = noteCompleted.checked;
  const id = noteIdField.value;
  
  if (id) {
    notes = notes.map((note) =>
      note.id == id ? { id: Number(id), title, description, notify, completed } : note
    );
  } else {
    const newNote = { id: generateId(), title, description, notify, completed };
    notes.push(newNote);
    sendNotification("Добавлена новая задача", title);
  }
  saveNotes();
  renderNotes();
  closeModalWindow();
});

function deleteNote(id) {
  notes = notes.filter((note) => note.id !== id);
  saveNotes();
  renderNotes();
}

function editNote(id) {
  const noteToEdit = notes.find((note) => note.id === id);
  if (noteToEdit) {
    openModal(noteToEdit);
  }
}

function updateConnectionStatus() {
  fetch("https://www.gstatic.com/generate_204", {
    method: "GET",
    mode: "no-cors",
  })
    .then(() => {
      connectionStatus.textContent = "Онлайн";
    })
    .catch(() => {
      connectionStatus.textContent = "Офлайн";
    });
}

addNoteBtn.addEventListener("click", () => openModal());
closeModal.addEventListener("click", closeModalWindow);
window.addEventListener("click", function (e) {
  if (e.target === modal) {
    closeModalWindow();
  }
});
refreshStatus.addEventListener("click", updateConnectionStatus);
window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

function startNotificationInterval() {
  if (notificationInterval) clearInterval(notificationInterval);
  
  notificationInterval = setInterval(() => {
    notes.forEach(note => {
      if (note.notify && !note.completed) {
        sendNotification("Есть невыполненные задачи", note.title);
      }
    });
  }, 1000);
}

filterContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("filter-btn")) {
    currentFilter = e.target.dataset.filter;
    renderNotes();
  }
});

unsubscribeBtn.addEventListener("click", () => {
  notes = notes.map(note => ({ ...note, notify: false }));
  saveNotes();
  renderNotes();
  if (notificationInterval) clearInterval(notificationInterval);
  alert("Вы отписались от уведомлений");
});

function init() {
  loadNotes();
  renderNotes();
  updateConnectionStatus();
  startNotificationInterval();
}
init();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/ServiceWorker.js")
      .then((reg) => console.log("Service Worker зарегистрирован:", reg.scope))
      .catch((err) =>
        console.log("Ошибка при регистрации Service Worker:", err)
      );
  });
}
