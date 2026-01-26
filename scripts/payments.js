import { supabase } from "./supabase.js";
import { logout } from "./session.js";

const tenantSelect = document.getElementById("tenantSelect");
const paymentAmountInput = document.getElementById("paymentAmount");
const paymentDateInput = document.getElementById("paymentDate");
const paymentNotesInput = document.getElementById("paymentNotes");
const savePaymentBtn = document.getElementById("savePaymentBtn");
const paymentMessage = document.getElementById("paymentMessage");
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
   SAVE PAYMENT
========================= */
async function savePayment() {
  paymentMessage.textContent = "Saving payment...";

  const tenantId = tenantSelect.value;
  const amount = parseFloat(paymentAmountInput.value);
  const date = paymentDateInput.value;
  const notes = paymentNotesInput.value.trim();

  if (!tenantId || isNaN(amount) || amount <= 0 || !date) {
    paymentMessage.textContent = "Tenant, amount, and date are required.";
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    paymentMessage.textContent = "Not authenticated.";
    return;
  }

  const { error } = await supabase
    .from("ledger_entries")
    .insert({
      user_id: user.id,
      tenant_id: tenantId,
      entry_date: date,
      entry_type: "payment",
      category: "Payment",
      amount: amount,
      notes: notes || "N/A"
    });

  if (error) {
    paymentMessage.textContent = error.message;
    return;
  }

  paymentMessage.textContent = "Payment recorded successfully.";

  paymentAmountInput.value = "";
  paymentNotesInput.value = "";
}

/* =========================
   EVENTS
========================= */
savePaymentBtn.addEventListener("click", savePayment);
logoutBtn.addEventListener("click", logout);

/* =========================
   INIT
========================= */
loadTenants();
