import { supabase } from "./supabase.js";
import { logout } from "./session.js";

const tenantSelect = document.getElementById("tenantSelect");
const ledgerBody = document.getElementById("ledgerBody");
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
    console.error("Tenant load error:", error.message);
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
   LOAD TENANT LEDGER
========================= */
async function loadTenantLedger(tenantId) {
  ledgerBody.innerHTML =
    "<tr><td colspan='4'>Loading...</td></tr>";

  const { data, error } = await supabase
    .from("ledger_entries")
    .select("entry_date, category, amount")
    .eq("tenant_id", tenantId)
    .order("entry_date");

  if (error) {
    ledgerBody.innerHTML =
      `<tr><td colspan='4'>${error.message}</td></tr>`;
    return;
  }

  ledgerBody.innerHTML = "";

  if (!data || data.length === 0) {
    ledgerBody.innerHTML =
      "<tr><td colspan='4'>N/A</td></tr>";
    return;
  }

  let runningBalance = 0;

  data.forEach(row => {
    runningBalance += Number(row.amount);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.entry_date}</td>
      <td>${row.category}</td>
      <td>${row.amount}</td>
      <td>${runningBalance.toFixed(2)}</td>
    `;
    ledgerBody.appendChild(tr);
  });
}

/* =========================
   EVENTS
========================= */
tenantSelect.addEventListener("change", e => {
  const tenantId = e.target.value;
  if (!tenantId) {
    ledgerBody.innerHTML =
      "<tr><td colspan='4'>N/A</td></tr>";
    return;
  }
  loadTenantLedger(tenantId);
});

logoutBtn.addEventListener("click", logout);

/* =========================
   INIT
========================= */
loadTenants();
