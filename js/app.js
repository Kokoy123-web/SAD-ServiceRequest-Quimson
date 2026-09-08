let currentUser = null;
let allRequests = [];
let editingRequestId = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  currentUser = session.user;
  document.getElementById("userEmail").textContent = currentUser.email || "Authenticated user";

  bindEvents();
  await loadRequests();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!session) window.location.href = "login.html";
  });
}

function bindEvents() {
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("newRequestBtn").addEventListener("click", () => openModal());
  document.getElementById("refreshBtn").addEventListener("click", loadRequests);
  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("statusFilter").addEventListener("change", applyFilters);
  document.getElementById("priorityFilter").addEventListener("change", applyFilters);
  document.getElementById("requestForm").addEventListener("submit", saveRequest);

  document.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", closeModal);
  });
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

async function loadRequests() {
  setTableLoading();

  const { data, error } = await supabaseClient
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast(error.message, "error");
    allRequests = [];
  } else {
    allRequests = data || [];
  }

  updateDashboard(allRequests);
  renderAnalytics(allRequests);
  applyFilters();
}

function setTableLoading() {
  document.getElementById("requestTableBody").innerHTML =
    `<tr><td colspan="8"><div class="loading">Loading requests<span>...</span></div></td></tr>`;
  document.getElementById("emptyState").classList.add("hidden");
}

function updateDashboard(requests) {
  document.getElementById("totalCount").textContent = requests.length;
  document.getElementById("pendingCount").textContent = requests.filter(r => r.status === "Pending").length;
  document.getElementById("progressCount").textContent = requests.filter(r => r.status === "In Progress").length;
  document.getElementById("completedCount").textContent = requests.filter(r => r.status === "Completed").length;
}

function applyFilters() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const priority = document.getElementById("priorityFilter").value;

  const filtered = allRequests.filter(r => {
    const matchesSearch =
      !search ||
      (r.requester_name || "").toLowerCase().includes(search) ||
      (r.description || "").toLowerCase().includes(search) ||
      (r.priority || "").toLowerCase().includes(search) ||
      (r.status || "").toLowerCase().includes(search) ||
      (r.department || "").toLowerCase().includes(search) ||
      (r.category || "").toLowerCase().includes(search);

    const matchesStatus = !status || r.status === status;
    const matchesPriority = !priority || r.priority === priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  renderTable(filtered);
  document.getElementById("resultCount").textContent =
    `${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
}

function renderTable(requests) {
  const tbody = document.getElementById("requestTableBody");
  const empty = document.getElementById("emptyState");

  if (!requests.length) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  tbody.innerHTML = requests.map(r => `
    <tr>
      <td><span class="id-chip">#${String(r.id).padStart(3, "0")}</span></td>
      <td>
        <div class="requester-cell">
          <strong>${escapeHtml(r.requester_name)}</strong>
          <small>${escapeHtml(r.description)}</small>
        </div>
      </td>
      <td>${escapeHtml(r.department)}</td>
      <td>${escapeHtml(r.category)}</td>
      <td><span class="badge priority-${slug(r.priority)}">${escapeHtml(r.priority)}</span></td>
      <td><span class="badge status-${slug(r.status)}">${escapeHtml(r.status)}</span></td>
      <td>${formatDate(r.created_at)}</td>
      <td>
        <div class="action-group">
          <button class="icon-btn edit-btn" data-id="${r.id}" title="Edit request">✎</button>
          <button class="icon-btn delete-btn" data-id="${r.id}" title="Delete request">⌫</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const request = allRequests.find(r => String(r.id) === btn.dataset.id);
      if (request) openModal(request);
    });
  });

  tbody.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteRequest(btn.dataset.id));
  });
}

function openModal(request = null) {
  editingRequestId = request ? request.id : null;
  document.getElementById("modalTitle").textContent = request ? "Edit Request" : "Create Request";
  document.getElementById("saveBtn").textContent = request ? "Save Changes" : "Save Request";
  document.getElementById("requestId").value = request?.id || "";
  document.getElementById("requesterName").value = request?.requester_name || "";
  document.getElementById("department").value = request?.department || "";
  document.getElementById("category").value = request?.category || "";
  document.getElementById("priority").value = request?.priority || "";
  document.getElementById("description").value = request?.description || "";
  document.getElementById("status").value = request?.status || "Pending";
  document.getElementById("statusField").classList.toggle("hidden", !request);
  document.getElementById("formError").classList.add("hidden");
  document.getElementById("modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
  document.getElementById("requesterName").focus();
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
  editingRequestId = null;
}

async function saveRequest(event) {
  event.preventDefault();

  const errorBox = document.getElementById("formError");
  errorBox.classList.add("hidden");

  const requester_name = document.getElementById("requesterName").value.trim();
  const department = document.getElementById("department").value.trim();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();
  const priority = document.getElementById("priority").value;
  const status = document.getElementById("status").value;
  const saveBtn = document.getElementById("saveBtn");

  if (!requester_name) return showFormError("Requester name cannot be empty.");
  if (!department) return showFormError("Department must be provided.");
  if (!category) return showFormError("Please select a category.");
  if (description.length < 10) return showFormError("Description must contain sufficient information (at least 10 characters).");
  if (!["Low", "Medium", "High"].includes(priority)) return showFormError("Please select a valid priority.");

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  let result;

  if (editingRequestId) {
    result = await supabaseClient
      .from("service_requests")
      .update({ requester_name, department, category, description, priority, status })
      .eq("id", editingRequestId)
      .eq("user_id", currentUser.id);
  } else {
    result = await supabaseClient
      .from("service_requests")
      .insert([{
        requester_name,
        department,
        category,
        description,
        priority,
        status: "Pending",
        user_id: currentUser.id
      }]);
  }

  saveBtn.disabled = false;
  saveBtn.textContent = editingRequestId ? "Save Changes" : "Save Request";

  if (result.error) {
    showFormError(result.error.message);
    return;
  }

  closeModal();
  showToast(editingRequestId ? "Request updated successfully." : "Request created successfully.");
  await loadRequests();
}

async function deleteRequest(id) {
  const request = allRequests.find(r => String(r.id) === String(id));
  if (!request) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete request #${request.id} for ${request.requester_name}?`
  );
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("service_requests")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showToast("Request deleted successfully.");
  await loadRequests();
}

function renderAnalytics(requests) {
  const categories = {};
  const priorities = {};

  requests.forEach(r => {
    categories[r.category] = (categories[r.category] || 0) + 1;
    priorities[r.priority] = (priorities[r.priority] || 0) + 1;
  });

  document.getElementById("categoryAnalytics").innerHTML =
    analyticsMarkup(categories, "category");
  document.getElementById("priorityAnalytics").innerHTML =
    analyticsMarkup(priorities, "priority");
}

function analyticsMarkup(data, type) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<p class="muted">No data yet.</p>`;
  const max = Math.max(...entries.map(([, count]) => count));

  return entries.map(([name, count]) => `
    <div class="analytics-row">
      <div class="analytics-label"><span>${escapeHtml(name)}</span><strong>${count}</strong></div>
      <div class="bar"><span style="width:${Math.max(8, (count / max) * 100)}%"></span></div>
    </div>
  `).join("");
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function slug(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showFormError(message) {
  const box = document.getElementById("formError");
  box.textContent = message;
  box.classList.remove("hidden");
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add("hidden"), 3200);
}
