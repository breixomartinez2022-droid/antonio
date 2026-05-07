const KEY = "amistad-calendar-v1";

const state = JSON.parse(localStorage.getItem(KEY) || "null") || {
  calendars: [],
  friends: [],
  activeCalendarId: null,
};

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function uid() {
  return crypto.randomUUID();
}

function activeCalendar() {
  return state.calendars.find((c) => c.id === state.activeCalendarId) || null;
}

function render() {
  renderCalendars();
  renderFriends();
  renderEvents();
  renderShareList();
  renderSharedWithMe();
  save();
}

function renderCalendars() {
  const ul = $("calendar-list");
  ul.innerHTML = "";
  state.calendars.forEach((calendar) => {
    const li = document.createElement("li");
    li.className = `list-item ${calendar.id === state.activeCalendarId ? "active" : ""}`;
    li.innerHTML = `<span>${calendar.name}</span><span class="pill">${calendar.events.length}</span>`;
    li.onclick = () => {
      state.activeCalendarId = calendar.id;
      render();
    };
    ul.appendChild(li);
  });
}

function renderFriends() {
  const ul = $("friend-list");
  ul.innerHTML = "";
  state.friends.forEach((friend) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `<span>${friend.name}</span><button data-id="${friend.id}">Eliminar</button>`;
    li.querySelector("button").onclick = () => {
      state.friends = state.friends.filter((f) => f.id !== friend.id);
      state.calendars.forEach((c) => {
        c.sharedWith = c.sharedWith.filter((id) => id !== friend.id);
      });
      render();
    };
    ul.appendChild(li);
  });
}

function renderEvents() {
  const list = $("event-list");
  const title = $("active-calendar-title");
  const meta = $("active-calendar-meta");
  list.innerHTML = "";

  const calendar = activeCalendar();
  if (!calendar) {
    title.textContent = "Selecciona un calendario";
    meta.textContent = "Crea o elige uno para empezar.";
    return;
  }

  title.textContent = calendar.name;
  meta.textContent = `Compartido con ${calendar.sharedWith.length} amigo(s)`;

  [...calendar.events]
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .forEach((event) => {
      const li = document.createElement("li");
      li.className = "event-item";
      li.innerHTML = `
        <div>
          <strong>${event.title}</strong>
          <div class="meta">${event.date} • ${event.time}</div>
          ${event.notes ? `<div class="meta">${event.notes}</div>` : ""}
        </div>
        <button data-id="${event.id}">Borrar</button>
      `;
      li.querySelector("button").onclick = () => {
        calendar.events = calendar.events.filter((e) => e.id !== event.id);
        render();
      };
      list.appendChild(li);
    });
}

function renderShareList() {
  const calendar = activeCalendar();
  const ul = $("share-list");
  ul.innerHTML = "";
  if (!calendar) return;

  state.friends.forEach((friend) => {
    const checked = calendar.sharedWith.includes(friend.id);
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `<label class="inline"><input type="checkbox" ${checked ? "checked" : ""}/> ${friend.name}</label>`;
    const checkbox = li.querySelector("input");
    checkbox.onchange = () => {
      if (checkbox.checked) calendar.sharedWith.push(friend.id);
      else calendar.sharedWith = calendar.sharedWith.filter((id) => id !== friend.id);
      render();
    };
    ul.appendChild(li);
  });
}

function renderSharedWithMe() {
  const ul = $("shared-with-me");
  ul.innerHTML = "";

  state.friends.forEach((friend) => {
    const shared = state.calendars.filter((c) => c.sharedWith.includes(friend.id));
    if (!shared.length) return;

    shared.forEach((calendar) => {
      const li = document.createElement("li");
      li.className = "event-item";
      li.innerHTML = `
        <div>
          <strong>${calendar.name}</strong>
          <div class="meta">Visible para: ${friend.name}</div>
          <div>${calendar.events.slice(0, 2).map((e) => `<span class="tag">${e.title}</span>`).join(" ") || "Sin actividades"}</div>
        </div>
      `;
      ul.appendChild(li);
    });
  });
}

$("calendar-form").onsubmit = (e) => {
  e.preventDefault();
  const input = $("calendar-name");
  state.calendars.push({
    id: uid(),
    name: input.value.trim(),
    events: [],
    sharedWith: [],
  });
  state.activeCalendarId = state.calendars.at(-1).id;
  input.value = "";
  render();
};

$("friend-form").onsubmit = (e) => {
  e.preventDefault();
  const input = $("friend-name");
  state.friends.push({ id: uid(), name: input.value.trim() });
  input.value = "";
  render();
};

$("event-form").onsubmit = (e) => {
  e.preventDefault();
  const calendar = activeCalendar();
  if (!calendar) return alert("Primero crea o selecciona un calendario.");

  calendar.events.push({
    id: uid(),
    title: $("event-title").value.trim(),
    date: $("event-date").value,
    time: $("event-time").value,
    notes: $("event-notes").value.trim(),
  });

  e.target.reset();
  render();
};

render();
