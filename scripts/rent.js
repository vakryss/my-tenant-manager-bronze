import { supabase } from "./supabase.js";
import { logout } from "./session.js";

/* =========================
   ELEMENTS
========================= */
const rentTableBody = document.getElementById("rentTableBody");
const rentMessage = document.getElementById("rentMessage");
const generateBtn = document.getElementById("generateRentBtn");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   HELPERS
========================= */
function getCurrentMonthDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/* =========================
   LOAD RENT CHARGES
========================= */
async function loadRentCharges() {
  const { data, error } = await supabase
    .from("rent_charges")
    .select(`
      amount,
      due_date,
      charge_month,
      tenants ( tenant_name )
    `)
    .order("due_date");

  if (error) {
    console.error("Load rent error:", error.message);
    rentMessage.textContent = error.message;
    return;
  }

  rentTableBody.innerHTML = "";

  if (!data || data.length === 0) {
    rentTableBody.innerHTML =
      "<tr><td colspan='4'>N/A</td></tr>";
    return;
  }

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.tenants.tenant_name}</td>
      <td>${row.amount}</td>
      <td>${row.due_date}</td>
      <td>${row.charge_month}</td>
    `;
    rentTableBody.appendChild(tr);
  });
}

/* =========================
   GENERATE RENT (FIXED)
========================= */
async function generateRent() {
  rentMessage.textContent = "Generating rent...";

  /* --- Auth guard --- */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    rentMessage.textContent = "Not authenticated.";
    return;
  }

  /* --- Load tenants --- */
  const { data: tenants, error: tenantError } = await supabase
    .from("tenants")
    .select("id, tenant_name, monthly_rent, rent_due_day");

  if (tenantError) {
    rentMessage.textContent = tenantError.message;
    return;
  }

  if (!tenants || tenants.length === 0) {
    rentMessage.textContent = "No tenants found.";
    return;
  }

  const monthDate = getCurrentMonthDate();

  /* --- Build rent charges --- */
  const charges = tenants.map(t => {
    const dueDate = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      t.rent_due_day
    );

    return {
      user_id: user.id,
      tenant_id: t.id,
      charge_month: monthDate,
      amount: t.monthly_rent,
      due_date: dueDate
    };
  });

  /* --- UPSERT (prevents duplicates) --- */
  const { error: insertError } = await supabase
    .from("rent_charges")
    .upsert(charges, {
      onConflict: "tenant_id,charge_month"
    });

  if (insertError) {
    rentMessage.textContent = insertError.message;
    return;
  }

  rentMessage.textContent = "Rent generated successfully.";
  await loadRentCharges();
}

/* =========================
   EVENTS
========================= */
generateBtn.addEventListener("click", generateRent);
logoutBtn.addEventListener("click", logout);

/* =========================
   INIT
========================= */
loadRentCharges();
