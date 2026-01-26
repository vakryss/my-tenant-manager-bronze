import { supabase } from "./supabase.js";
import { logout } from "./session.js";

const ledgerTableBody = document.getElementById("ledgerTableBody");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   LOAD LEDGER
========================= */
async function loadLedger() {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(`
      entry_date,
      entry_type,
      category,
      amount,
      notes,
      tenants ( tenant_name )
    `)
    .order("entry_date");

  if (error) {
    console.error("Ledger load error:", error.message);
    return;
  }

  ledgerTableBody.innerHTML = "";

  if (!data || data.length === 0) {
    ledgerTableBody.innerHTML =
      "<tr><td colspan='6'>N/A</td></tr>";
    return;
  }

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.entry_date}</td>
      <td>${row.tenants ? row.tenants.tenant_name : "N/A"}</td>
      <td>${row.entry_type}</td>
      <td>${row.category}</td>
      <td>${row.amount}</td>
      <td>${row.notes || "N/A"}</td>
    `;
    ledgerTableBody.appendChild(tr);
  });
}

/* =========================
   EVENTS
========================= */
logoutBtn.addEventListener("click", logout);

/* =========================
   INIT
========================= */
loadLedger();
