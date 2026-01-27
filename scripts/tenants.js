import { supabase } from "./supabase.js";

/* =========================
   SAFE ELEMENT GETTERS
========================= */
const $ = id => document.getElementById(id);

/* TABLE */
const tenantTableBody = $("tenantTableBody");

/* MODALS */
const addModal = $("addModal");
const editModal = $("editModal");

/* ADD FORM */
const openAddBtn = $("openAddModal");
const submitAddBtn = $("submitAdd");

/* EDIT FORM */
const submitEditBtn = $("submitEdit");

/* =========================
   HELPERS
========================= */
function getChecked(groupId) {
  const group = $(groupId);
  if (!group) return [];
  return Array.from(group.querySelectorAll("input:checked")).map(cb => cb.value);
}

function closeModal(modal) {
  if (modal) modal.style.display = "none";
}

function openModal(modal) {
  if (modal) modal.style.display = "flex";
}

/* =========================
   LOAD TENANTS
========================= */
async function loadTenants() {
  if (!tenantTableBody) return;

  const { data, error } = await supabase
    .from("tenants")
    .select("id, tenant_name, monthly_rent, rent_due_day, utilities")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Load tenants failed:", error.message);
    return;
  }

  tenantTableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tenantTableBody.innerHTML =
      `<tr><td colspan="5">No tenants yet</td></tr>`;
    return;
  }

  data.forEach(t => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${t.tenant_name}</td>
      <td>₱${Number(t.monthly_rent).toFixed(2)}</td>
      <td>${t.rent_due_day}</td>
      <td>${(t.utilities || []).join(", ") || "—"}</td>
      <td>
        <button class="secondary" data-id="${t.id}">Edit</button>
      </td>
    `;

    tr.querySelector("button").addEventListener("click", () => openEdit(t));
    tenantTableBody.appendChild(tr);
  });
}

/* =========================
   ADD TENANT
========================= */
if (openAddBtn && addModal) {
  openAddBtn.addEventListener("click", () => openModal(addModal));
}

if (submitAddBtn) {
  submitAddBtn.addEventListener("click", async () => {
    if (!confirm("Add this tenant?")) return;

    await supabase.from("tenants").insert({
      tenant_name: $("addTenantName").value,
      monthly_rent: $("addMonthlyRent").value,
      rent_due_day: $("addRentDueDay").value,
      utilities: getChecked("addUtilities")
    });

    closeModal(addModal);
    loadTenants();
  });
}

/* =========================
   EDIT TENANT
========================= */
function openEdit(t) {
  if (!editModal) return;

  openModal(editModal);
  $("editTenantId").value = t.id;
  $("editTenantName").value = t.tenant_name;
  $("editMonthlyRent").value = t.monthly_rent;
  $("editRentDueDay").value = t.rent_due_day;

  $("editUtilities")
    .querySelectorAll("input")
    .forEach(cb => {
      cb.checked = (t.utilities || []).includes(cb.value);
    });
}

if (submitEditBtn) {
  submitEditBtn.addEventListener("click", async () => {
    if (!confirm("Update this tenant?")) return;

    await supabase
      .from("tenants")
      .update({
        tenant_name: $("editTenantName").value,
        monthly_rent: $("editMonthlyRent").value,
        rent_due_day: $("editRentDueDay").value,
        utilities: getChecked("editUtilities")
      })
      .eq("id", $("editTenantId").value);

    closeModal(editModal);
    loadTenants();
  });
}

/* =========================
   INIT
========================= */
loadTenants();
