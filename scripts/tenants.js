import { supabase } from "./supabase.js";

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     ELEMENT SHORTCUT
  ========================= */
  const $ = id => document.getElementById(id);

  /* =========================
     CORE ELEMENTS
  ========================= */
  const tenantTableBody = $("tenantTableBody");
  const openAddBtn = $("openAddModal");
  const addModal = $("addModal");
  const editModal = $("editModal");
  const submitAddBtn = $("submitAdd");
  const submitEditBtn = $("submitEdit");

  /* =========================
     SAFETY CHECKS
  ========================= */
  if (!tenantTableBody) {
    console.error("tenantTableBody not found");
    return;
  }

  /* =========================
     UTILITIES
  ========================= */
  function getChecked(containerId) {
    const container = $(containerId);
    if (!container) return [];

    return Array.from(
      container.querySelectorAll("input:checked")
    ).map(cb => cb.value);
  }

  function openModal(modal) {
    if (modal) modal.style.display = "flex";
  }

  function closeModal(modal) {
    if (modal) modal.style.display = "none";
  }

  /* =========================
     LOAD TENANTS
  ========================= */
  async function loadTenants() {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, tenant_name, monthly_rent, rent_due_day, utilities")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load tenants:", error.message);
      return;
    }

    tenantTableBody.innerHTML = "";

    if (!data || data.length === 0) {
      tenantTableBody.innerHTML = `
  <tr>
    <td colspan="5">No tenants yet</td>
  </tr>
`;
    }
       
    data.forEach(t => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
  <td>${t.tenant_name}</td>
  <td>₱${Number(t.monthly_rent).toFixed(2)}</td>
  <td>${t.rent_due_day}</td>
  <td>${(t.utilities && t.utilities.length)
    ? t.utilities.join(", ")
    : "—"}</td>
  <td>
    <button class="secondary">Edit</button>
  </td>
`;

      tr.querySelector("button").addEventListener("click", () => {
        openEditModal(t);
      });

      tenantTableBody.appendChild(tr);
    });
  }

  /* =========================
     ADD TENANT
  ========================= */
  if (openAddBtn && addModal) {
    openAddBtn.addEventListener("click", () => {

      // 🔧 RESET SAVE BUTTON STATE (FIX)
      submitAddBtn.disabled = false;
      submitAddBtn.textContent = "Save";

      openModal(addModal);
    });
  }

  if (submitAddBtn) {
    submitAddBtn.addEventListener("click", async () => {
      if (!confirm("Add this tenant?")) return;

      // Disable button
      submitAddBtn.disabled = true;
      const originalText = submitAddBtn.textContent;
      submitAddBtn.textContent = "Saving… Please wait...";

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Not authenticated");
        submitAddBtn.disabled = false;
        submitAddBtn.textContent = originalText;
        return;
      }

      const payload = {
        user_id: user.id,
        tenant_name: $("addTenantName").value.trim(),
        monthly_rent: Number($("addMonthlyRent").value),
        rent_due_day: Number($("addRentDueDay").value),
        utilities: getChecked("addUtilities")
      };

      const { error } = await supabase
        .from("tenants")
        .insert(payload);
       
      submitAddBtn.disabled = false;
      submitAddBtn.textContent = originalText;
       
      if (error) {
        alert(error.message);
        return;
      }

      closeModal(addModal);
      loadTenants();
    });
  }

  /* =========================
     EDIT TENANT
  ========================= */
  function openEditModal(t) {
    if (!editModal) return;

    $("editTenantId").value = t.id;
    $("editTenantName").value = t.tenant_name;
    $("editMonthlyRent").value = t.monthly_rent;
    $("editRentDueDay").value = t.rent_due_day;

    const utilitiesContainer = $("editUtilities");
    utilitiesContainer.querySelectorAll("input").forEach(cb => {
      cb.checked = (t.utilities || []).includes(cb.value);
    });

    openModal(editModal);
  }

  if (submitEditBtn) {
    submitEditBtn.addEventListener("click", async () => {
      if (!confirm("Update this tenant?")) return;

      const id = $("editTenantId").value;

      const payload = {
        tenant_name: $("editTenantName").value.trim(),
        monthly_rent: Number($("editMonthlyRent").value),
        rent_due_day: Number($("editRentDueDay").value),
        utilities: getChecked("editUtilities")
      };

      const { error } = await supabase
        .from("tenants")
        .update(payload)
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      closeModal(editModal);
      loadTenants();
    });
  }

  /* =========================
     INIT
  ========================= */
  loadTenants();

});
