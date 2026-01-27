import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const tenantTableBody = $("tenantTableBody");
  const statusFilter = $("statusFilter");

  const openAddBtn = $("openAddModal");
  const addModal = $("addModal");
  const editModal = $("editModal");

  const submitAddBtn = $("submitAdd");
  const submitEditBtn = $("submitEdit");

  const movedOutWrap = $("movedOutDateWrap");
  const lastSeenWrap = $("lastSeenDateWrap");

  function openModal(m) { if (m) m.style.display = "flex"; }
  function closeModal(m) { if (m) m.style.display = "none"; }

  function renderStatus(status, dateLabel, dateValue) {
    const colors = {
      Active: "background:#16a34a;color:white;",
      "Moved Out": "background:#9ca3af;color:black;",
      "Left Without Notice": "background:#000;color:white;"
    };

    let info = "";
    if (dateValue) {
      info = `
        <span style="font-style:italic;cursor:pointer;margin-left:4px;"
              title="${dateLabel}: ${dateValue}">
          i
        </span>`;
    }

    return `
      <span style="padding:4px 8px;border-radius:6px;font-size:0.75rem;${colors[status]}">
        ${status}${info}
      </span>
    `;
  }

  async function loadTenants() {
    const filter = statusFilter.value;

    let query = supabase
      .from("tenants")
      .select("*");

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) return;

    const tenants = data.sort((a, b) =>
      a.tenant_name.localeCompare(b.tenant_name)
    );

    tenantTableBody.innerHTML = "";

    if (!tenants.length) {
      tenantTableBody.innerHTML = `
        <tr><td colspan="6">No tenants found</td></tr>
      `;
      return;
    }

    tenants.forEach(t => {
      const dateLabel =
        t.status === "Moved Out" ? "Moved Out Date" :
        t.status === "Left Without Notice" ? "Last Seen Date" : "";

      const dateValue =
        t.status === "Moved Out" ? t.moved_out_date :
        t.status === "Left Without Notice" ? t.last_seen_date : null;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.tenant_name}</td>
        <td>${renderStatus(t.status || "Active", dateLabel, dateValue)}</td>
        <td>₱${Number(t.monthly_rent).toFixed(2)}</td>
        <td>${t.rent_due_day}</td>
        <td>${(t.utilities || []).join(", ") || "—"}</td>
        <td><button class="secondary">Edit</button></td>
      `;

      tr.querySelector("button").onclick = () => openEditModal(t);
      tenantTableBody.appendChild(tr);
    });
  }

  function openEditModal(t) {
    $("editTenantId").value = t.id;
    $("editTenantName").value = t.tenant_name;
    $("editTenantStatus").value = t.status || "Active";
    $("editMonthlyRent").value = t.monthly_rent;
    $("editRentDueDay").value = t.rent_due_day;
    $("editMovedOutDate").value = t.moved_out_date || "";
    $("editLastSeenDate").value = t.last_seen_date || "";

    updateStatusFields();
    openModal(editModal);
  }

  function updateStatusFields() {
    const status = $("editTenantStatus").value;

    movedOutWrap.style.display = status === "Moved Out" ? "block" : "none";
    lastSeenWrap.style.display = status === "Left Without Notice" ? "block" : "none";
  }

  $("editTenantStatus").addEventListener("change", updateStatusFields);

  submitEditBtn.onclick = async () => {
    const payload = {
      tenant_name: $("editTenantName").value.trim(),
      status: $("editTenantStatus").value,
      monthly_rent: Number($("editMonthlyRent").value),
      rent_due_day: Number($("editRentDueDay").value),
      moved_out_date:
        $("editTenantStatus").value === "Moved Out"
          ? $("editMovedOutDate").value
          : null,
      last_seen_date:
        $("editTenantStatus").value === "Left Without Notice"
          ? $("editLastSeenDate").value
          : null
    };

    await supabase.from("tenants").update(payload)
      .eq("id", $("editTenantId").value);

    closeModal(editModal);
    loadTenants();
  };

  statusFilter.onchange = loadTenants;
  loadTenants();
});
