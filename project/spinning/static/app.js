/* Helper UI bits */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 2200);
}

/* Modal controls */
const modal = $("#modalBackdrop");
const openCreateBtn = $("#openCreate");
const closeModalBtn = $("#closeModal");
const cancelModalBtn = $("#cancelModal");
const tileCreate = $("#tileCreate");
const tileModify = $("#tileModify");
const tileRetrieve = $("#tileRetrieve");
const form = $("#actionForm");
const submitBtn = $("#submitBtn");
const modalTitle = $("#modalTitle");

function openModal(editing = false, data = null) {
  modal.style.display = "flex";
  if (editing && data) {
    modalTitle.textContent = "Update Action";
    $("#actionId").value = data.id;
    $("#title").value = data.title;
    $("#description").value = data.description || "";
    $("#status").value = data.status || "pending";
  } else {
    modalTitle.textContent = "Create Action";
    $("#actionId").value = "";
    form.reset();
  }
  setTimeout(() => $("#title").focus(), 0);
}
function closeModal() { modal.style.display = "none"; }

openCreateBtn?.addEventListener("click", () => openModal(false));
tileCreate?.addEventListener("click", () => openModal(false));
closeModalBtn?.addEventListener("click", closeModal);
cancelModalBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

/* Create / Update submit */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;

  const id = $("#actionId").value;
  const payload = {
    title: $("#title").value.trim(),
    description: $("#description").value.trim(),
    status: $("#status").value
  };

  try {
    if (id) {
      const res = await fetch(`/api/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Update failed");
      toast("Action updated");
    } else {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Create failed");
      toast("Action created");
    }
    await refreshRecent(); // reflect changes
    closeModal();
  } catch (err) {
    console.error(err);
    toast(err.message || "Something went wrong");
  } finally {
    submitBtn.disabled = false;
  }
});

/* Quick edit / view / delete from table */
async function getActionById(id){
  const res = await fetch(`/api/actions/${id}`);
  if (res.status === 404) throw new Error("Action not found");
  const json = await res.json();
  return json.action;
}

$("#recentBody")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.classList.contains("js-edit")) {
    const data = await getActionById(id);
    openModal(true, data);
  } else if (btn.classList.contains("js-view")) {
    const data = await getActionById(id);
    alert(`Title: ${data.title}\nStatus: ${data.status}\n\n${data.description || ""}`);
  } else if (btn.classList.contains("js-del")) {
    if (confirm("Delete this action?")) {
      const res = await fetch(`/api/actions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) { toast(json.error || "Delete failed"); return; }
      toast("Deleted");
      await refreshRecent();
    }
  }
});

/* Search / retrieve */
$("#btnSearch")?.addEventListener("click", async () => {
  const q = $("#q").value.trim();
  const status = $("#filterStatus").value;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);

  const res = await fetch(`/api/actions?${params.toString()}`);
  const json = await res.json();
  const wrap = $("#searchResults");
  if (!json.ok) { wrap.textContent = "Something went wrong"; return; }

  if (!json.actions.length) {
    wrap.innerHTML = `<p class="muted">No matching actions.</p>`;
    return;
  }
  wrap.innerHTML = `
    <div style="overflow:auto">
      <table aria-label="Search results">
        <thead><tr><th>Title</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
        <tbody>
          ${json.actions.map(a => `
            <tr>
              <td>${a.title}</td>
              <td><span class="badge ${a.status}">${a.status.replace('-', ' ')}</span></td>
              <td>${new Date(a.updated_at).toISOString().replace('T',' ').slice(0,16)} UTC</td>
              <td>
                <button class="btn ghost" onclick="openForEdit('${a.id}')">Edit</button>
                <button class="btn ghost" onclick="openForView('${a.id}')">View</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
});

window.openForEdit = async (id) => {
  const data = await getActionById(id);
  openModal(true, data);
};
window.openForView = async (id) => {
  const data = await getActionById(id);
  alert(`Title: ${data.title}\nStatus: ${data.status}\n\n${data.description || ""}`);
};

/* Modify tile opens modal after quick pick */
tileModify?.addEventListener("click", async () => {
  const res = await fetch("/api/actions");
  const { actions } = await res.json();
  if (!actions.length) { toast("No actions yet — create one first!"); return; }
  // open the latest for convenience
  openModal(true, actions[0]);
});

/* Retrieve tile focuses search */
tileRetrieve?.addEventListener("click", () => $("#q").focus());

/* Refresh recent table after changes */
async function refreshRecent(){
  const res = await fetch("/api/actions");
  const json = await res.json();
  if (!json.ok) return;
  const recent = json.actions.slice(0,8);
  const body = $("#recentBody");
  if (!body) return;
  body.innerHTML = recent.map(a => `
    <tr data-id="${a.id}">
      <td>${a.title}</td>
      <td><span class="badge ${a.status}">${a.status.replace('-', ' ')}</span></td>
      <td>${new Date(a.updated_at).toISOString().replace('T',' ').slice(0,16)} UTC</td>
      <td>
        <button class="btn ghost js-edit" data-id="${a.id}">Edit</button>
        <button class="btn ghost js-view" data-id="${a.id}">View</button>
        <button class="btn ghost js-del" data-id="${a.id}">Delete</button>
      </td>
    </tr>
  `).join("");
}
