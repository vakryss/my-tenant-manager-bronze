import { supabase } from "./supabase.js";
import { logout } from "./session.js";

const tenantSelect = document.getElementById("tenantSelect");
const utilityTypeSelect = document.getElementById("utilityType");
const chargeDateInput = document.getElementById("chargeDate");
const amountInput = document.getElementById("amount");
const notesInput = document.getElementById("notes");
const saveUtilityBtn = document.getElementById("saveUtilityBtn");
const utilityMessage = document.getElementById("utilityMessage");
const utilityTableBody = document.getElementById("utilityTableBody");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   LOAD TENANTS
========================= */
async function loadTenants() {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, tenant_name")
    .order("tenant_name");

  if (error) {
    console.error(error.message);
    tenantSelect.innerHTML = `<option value="">N/A</option>`;
    return;
  }

  tenantSelect.innerHTML = `<option value="">N/A</option>`;

  data.forEach(t => {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = t.tenant_name;
    tenantSelect.appendChild(option);
  });
}

/* =========================
   LOAD UTILITIES
========================= */
async function loadUtilities() {
  const { data, error } = await supabase
    .from("utility_charges")
    .select(`
      charge_date,
      utility_type,
      amount,
      tenants ( tenant_name )
    `)
    .order("charge_date", { ascending: false });

  if (error) {
    console.error(error.message);
    return;
  }

  utilityTableBody.innerHTML = "";

  if (!data || data.length === 0) {
    utilityTableBody.innerHTML =
      "<tr><td colspan='4'>N/A</td></tr>";
    return;
  }

  data.forEach(row => {
    const tenantName =
      row.tenants && row.tenants.tenant_name
        ? row.tenants.tenant_name
        : "N/A";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.charge_date}</td>
      <td>${tenantName}</td>
      <td>${row.utility_type}</td>
      <td>${row.amount}</td>
    `;
    utilityTableBody.appendChild(tr);
  });
}

/* =========================
   SAVE UTILITY + LEDGER
========================= */
async function saveUtility() {
  utilityMessage.textContent = "Saving utility charge...";

  const tenantId = tenantSelect.value;
  const utilityType = utilityTypeSelect.value;
  const chargeDate = chargeDateInput.value;
  const amount = parseFloat(amountInput.value);
  const notes = notesInput.value.trim();

  if (!tenantId || !utilityType || !chargeDate || isNaN(amount)) {
    utilityMessage.textContent = "All required fields must be filled.";
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    utilityMessage.textContent = "Not authenticated.";
    return;
  }

  const { error: utilityError } = await supabase
    .from("utility_charges")
    .insert({
      user_id: user.id,
      tenant_id: tenantId,
      utility_type: utilityType,
      charge_date: chargeDate,
      amount: amount,
      notes: notes || "N/A"
    });

  if (utilityError) {
    utilityMessage.textContent = utilityError.message;
    return;
  }

  const { error: ledgerError } = await supabase
    .from("ledger_entries")
    .insert({
      user_id: user.id,
      tenant_id: tenantId,
      entry_date: chargeDate,
      entry_type: "charge",
      category: utilityType,
      amount: amount * -1,
      notes: notes || "Utility charge"
    });

  if (ledgerError) {
    utilityMessage.textContent = ledgerError.message;
    return;
  }

  utilityMessage.textContent = "Utility charge recorded.";

  amountInput.value = "";
  notesInput.value = "";

  await loadUtilities();
}

/* =========================
   EVENTS
========================= */
saveUtilityBtn.addEventListener("click", saveUtility);
logoutBtn.addEventListener("click", logout);

/* =========================
   INIT
========================= */
loadTenants();
loadUtilities();
