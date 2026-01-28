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

  /* =========================
     OPEN ADD TENANT MODAL
  ========================= */
  if (openAddBtn && addModal) {
    openAddBtn.addEventListener("click", () => {
      $("addTenantName").value = "";
      $("addMonthlyRent").value = "";
      $("addRentDueDay").value = "";

      document
        .querySelectorAll("#addUtilities input[type='checkbox']")
        .forEach(cb => cb.checked = false);

      submitAddBtn.disabled = false;
      submitAddBtn.textContent = "Save";

      addModal.style.display = "flex";
    });
  }

  const movedOutWrap = $("movedOutDateWrap");
  const lastSeenWrap = $("lastSeenDateWrap");

  function openModal(m) { if (m) m.style.display = "flex"; }
  function closeModal(m) { if (m) m.style.display = "none"; }

  /* =========================
     STATUS RENDER
  ========================= */
  function renderStatus(status, dateLabel, dateValue, tenantId) {
    const styles = {
      Active: "background:#16a34a;color:white;",
      "Moved Out": "background:#9ca3af;color:black;",
      "Left Without Notice": "background:#000;color:white;"
    };

    if (!dateValue) {
      return `
        <span style="padding:4px 8px;border-radius:6px;font-size:0.75rem;${styles[status]}">
          ${status}
        </span>
      `;
    }

    return `
      <span style="position:relative;display:inline-flex;align-items:center;">
        <span style="padding:4px 8px;border-radius:6px;font-size:0.75rem;${styles[status]}">
          ${status}
        </span>
        <span class="status-info" data-tooltip-id="tooltip-${tenantId}" style="margin-left:6px;cursor:pointer;">ℹ️</span>
        <div id="tooltip-${tenantId}" class="status-tooltip" style="display:none;position:absolute;top:100%;left:0;margin-top:6px;background:#fff;border:1px solid #d1d5db;padding:6px 8px;border-radius:6px;font-size:0.75rem;white-space:nowrap;z-index:100;">
          <strong>${dateLabel}:</strong> ${dateValue}
        </div>
      </span>
    `;
  }

  /* =========================
     LOAD TENANTS
  ========================= */
  async function loadTenants() {
    const filter = statusFilter.value;

    let query = supabase.from("tenants").select("*");
    if (filter !== "all") query = query.eq("status", filter);

    const { data, error } = await query;
    if (error) return;

    const tenants = data.sort((a, b) => a.tenant_name.localeCompare(b.tenant_name));
    tenantTableBody.innerHTML = "";

    if (!tenants.length) {
      tenantTableBody.innerHTML = `<tr><td colspan="6">No tenants found</td></tr>`;
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
        <td>${renderStatus(t.status || "Active", dateLabel, dateValue, t.id)}</td>
        <td>₱${Number(t.monthly_rent).toFixed(2)}</td>
        <td>${t.rent_due_day}</td>
        <td>${(t.utilities || []).join(", ") || "—"}</td>
        <td><button class="secondary">Edit</button></td>
      `;
      tr.querySelector("button").onclick = () => openEditModal(t);
      tenantTableBody.appendChild(tr);
    });

    setTimeout(() => {
      const tooltips = document.querySelectorAll(".status-tooltip");
      const closeAll = () => tooltips.forEach(t => t.style.display = "none");

      document.querySelectorAll(".status-info").forEach(icon => {
        const tooltip = document.getElementById(icon.dataset.tooltipId);
        icon.onmouseenter = () => { closeAll(); tooltip.style.display = "block"; };
        icon.onmouseleave = () => tooltip.style.display = "none";
        icon.onclick = e => { e.stopPropagation(); };
      });

      document.addEventListener("click", closeAll);
    }, 0);
  }

  /* =========================
     EDIT TENANT
  ========================= */
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
    $("editTenantStatus").dataset.status = status;
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
      moved_out_date: $("editTenantStatus").value === "Moved Out" ? $("editMovedOutDate").value : null,
      last_seen_date: $("editTenantStatus").value === "Left Without Notice" ? $("editLastSeenDate").value : null
    };

    await supabase.from("tenants").update(payload)
      .eq("id", $("editTenantId").value);

    closeModal(editModal);
    loadTenants();
  };

  /* =========================
     ADD TENANT WARNING HANDLERS (FIXED)
  ========================= */
  const addTenantWarning = $("addTenantWarning");
  const cancelAddWarningBtn = $("cancelAddWarning");
  const confirmAddWarningBtn = $("confirmAddWarning");

  cancelAddWarningBtn.onclick = () => {
    addTenantWarning.style.display = "none";
    addModal.style.pointerEvents = "auto";
  };

  confirmAddWarningBtn.onclick = () => {
    sessionStorage.setItem("tenantAddConsent", "true");
    addTenantWarning.style.display = "none";
    addModal.style.pointerEvents = "auto";
    submitAddBtn.click();
  };

  /* =========================
     ADD TENANT SAVE
  ========================= */
  submitAddBtn.onclick = async () => {
    if (!sessionStorage.getItem("tenantAddConsent")) {
      addTenantWarning.style.display = "flex";
      addModal.style.pointerEvents = "none";
      return;
    }

    submitAddBtn.disabled = true;
    submitAddBtn.textContent = "Saving… Please wait...";

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      tenant_name: $("addTenantName").value.trim(),
      status: "Active",
      monthly_rent: Number($("addMonthlyRent").value),
      rent_due_day: Number($("addRentDueDay").value),
      utilities: Array.from(document.querySelectorAll("#addUtilities input:checked")).map(cb => cb.value)
    };

    await supabase.from("tenants").insert(payload);

    submitAddBtn.disabled = false;
    submitAddBtn.textContent = "Save";

    addModal.classList.add("success-flash");
    setTimeout(() => {
      addModal.classList.remove("success-flash");
      closeModal(addModal);
    }, 300);

    loadTenants();
  };

  statusFilter.onchange = loadTenants;
  loadTenants();
});
