// ===== Настройки =====
const WEDDING_DATE = "2026-08-01T16:00:00+03:00";
const STORAGE_KEY = "wedding_rsvp_v1";

// ===== Google Forms (поле guests удалено) =====
const GOOGLE_FORM_URL = "https://docs.google.com/forms/u/0/d/1s7Eo6qzYL_iM1WGPgvxPg9F7DvcC1Ru9BWJpkJLOV5E/formResponse";
const FIELD_IDS = {
  name:       "entry.1923451685",   // Имя и фамилия
  attendance: "entry.924176924",    // Присутствие
  note:       "entry.550404454"     // Комментарий
};

const GOOGLE_ATTENDANCE_MAP = {
  "yes":   "Да, буду",
  "no":    "К сожалению, не смогу",
  "maybe": "Пока, не знаю"
};

// ===== Mobile nav =====
const toggleBtn = document.querySelector(".nav__toggle");
const nav = document.querySelector("[data-nav]");

if (toggleBtn && nav) {
  toggleBtn.addEventListener("click", () => {
    const opened = nav.classList.toggle("is-open");
    toggleBtn.setAttribute("aria-expanded", String(opened));
  });

  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  });
}

// ===== Reveal on scroll =====
const revealEls = Array.from(document.querySelectorAll(".reveal"));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add("is-visible");
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// ===== Countdown =====
const dd = document.querySelector("[data-dd]");
const hh = document.querySelector("[data-hh]");
const mm = document.querySelector("[data-mm]");
const ss = document.querySelector("[data-ss]");
const target = new Date(WEDDING_DATE);

function pad(n){ return String(n).padStart(2, "0"); }
function tick(){
  const now = new Date();
  let diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    if (dd) dd.textContent = "0";
    if (hh) hh.textContent = "00";
    if (mm) mm.textContent = "00";
    if (ss) ss.textContent = "00";
    return;
  }
  const sec = Math.floor(diff / 1000);
  const days = Math.floor(sec / (3600 * 24));
  const hours = Math.floor((sec % (3600 * 24)) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  if (dd) dd.textContent = String(days);
  if (hh) hh.textContent = pad(hours);
  if (mm) mm.textContent = pad(mins);
  if (ss) ss.textContent = pad(secs);
}
tick();
setInterval(tick, 1000);

// ===== Lightbox (оставлен) =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox?.querySelector(".lightbox__img");
const lightboxClose = lightbox?.querySelector(".lightbox__close");

function openLightbox(src){
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeLightbox(){
  if (!lightbox || !lightboxImg) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  document.body.style.overflow = "";
}
document.querySelectorAll("[data-lightbox]").forEach(a => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    openLightbox(a.getAttribute("href"));
  });
});
lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ===== RSVP (localStorage + Google Forms) =====
const form = document.getElementById("rsvpForm");
const statusEl = document.getElementById("rsvpStatus");
const downloadBtn = document.getElementById("downloadRsvp");

function setStatus(text){
  if (statusEl) statusEl.textContent = text;
}
function loadSaved(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{ return null; }
}
function save(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
}
function downloadJson(filename, data){
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Обработка отправки (без поля guests)
form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    name: form.name.value.trim(),
    attendance: form.attendance.value,
    note: form.note.value.trim(),
    savedAt: new Date().toISOString()
  };

  if (!data.name) {
    setStatus("Пожалуйста, укажите имя.");
    return;
  }

  save(data);

  const googleAttendance = GOOGLE_ATTENDANCE_MAP[data.attendance] || data.attendance;

  const formData = new FormData();
  formData.append(FIELD_IDS.name, data.name);
  formData.append(FIELD_IDS.attendance, googleAttendance);
  formData.append(FIELD_IDS.note, data.note);

  setStatus("Отправляем ваш ответ...");

  fetch(GOOGLE_FORM_URL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  })
    .then(() => {
      setStatus("Готово! Ответ отправлен. Спасибо! 💌");
    })
    .catch((error) => {
      console.error("Ошибка отправки:", error);
      setStatus("Не удалось отправить. Проверьте соединение и попробуйте снова.");
    });
});

downloadBtn?.addEventListener("click", () => {
  const data = loadSaved();
  if (!data) {
    setStatus("Пока нечего скачивать — сначала отправьте форму.");
    return;
  }
  downloadJson("rsvp.json", data);
  setStatus("Файл rsvp.json скачан.");
});
