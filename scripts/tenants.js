import { supabase } from "./supabase.js";
import { logout } from "./session.js";

/* =========================
   ELEMENTS
========================= */
const tenantNameInput = document.getElementById("tenantName");
const monthlyRentInput = document.getElementById("monthlyRent");
const rentDueDayInput = document.getElementById("rentDueDay");
const addTenantBtn = document.getElementById("addTenantBtn");
const tenantMessage = document.getElementById("tenantMessage");
const tenantTableBody = document.getElementById("tenantTableBody");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   LOAD TENANTS
========================= */
async function loadTenants() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("tenants")
    .select("tenant_name, monthly_rent, rent_due_day")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Load tenants error:", error.message);
    return;
  }

  tenantTableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tenantTableBody.innerHTML = `
      <tr>
        <td colspan="3">N/A</td>
      </tr>
    `;
    return;
  }

  data.forEach(tenant => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${tenant.tenant_name}</td>
      <td>${tenant.monthly_rent}</td>
      <td>${tenant.rent_due_day}</td>
    `;

    tenantTableBody.appendChild(row);
  });
}

/* =========================
   ADD TENANT
========================= */
async function addTenant() {
  tenantMessage.textContent = "Saving...";

  const tenantName = tenantNameInput.value.trim();
  const monthlyRent = parseFloat(monthlyRentInput.value);
  const rentDueDay = parseInt(rentDueDayInput.value, 10);

  if (!tenantName || isNaN(monthlyRent) || isNaN(rentDueDay)) {
    tenantMessage.textContent = "All fields are required.";
    return;
  }

  if (rentDueDay < 1 || rentDueDay > 31) {
    tenantMessage.textContent = "Rent due day must be between 1 and 31.";
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    tenantMessage.textContent = "Not authenticated.";
    return;
  }

  const { error } = await supabase
    .from("tenants")
    .insert({
      user_id: user.id,
      tenant_name: tenantName,
      monthly_rent: monthlyRent,
      rent_due_day: rentDueDay
    });

  if (error) {
    tenantMessage.textContent = error.message;
    return;
  }

  tenantMessage.textContent = "Tenant added successfully.";

  tenantNameInput.value = "";
  monthlyRentInput.value = "";
  rentDueDayInput.value = "";

  await loadTenants();
}

/* =========================
   EVENTS
========================= */
addTenantBtn.addEventListener("click", addTenant);
logoutBtn.addEventListener("click", logout);

/* =========================
   INIT
========================= */
loadTenants();
