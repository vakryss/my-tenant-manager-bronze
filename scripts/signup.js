import { supabase } from "./supabase.js";

/* =========================
   ELEMENT REFERENCES
========================= */
const signupBtn = document.getElementById("signupBtn");
const message = document.getElementById("message");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const countryInput = document.getElementById("country");

const termsCheckbox = document.getElementById("terms");
const privacyCheckbox = document.getElementById("privacy");

const togglePassword = document.getElementById("togglePassword");

/* =========================
   SHOW / HIDE PASSWORD
========================= */
if (togglePassword && passwordInput) {
  togglePassword.addEventListener("change", () => {
    passwordInput.type = togglePassword.checked ? "text" : "password";
  });
}

/* =========================
   SIGNUP HANDLER
========================= */
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    message.textContent = "Processing...";

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const country = countryInput.value.trim();
    const termsAccepted = termsCheckbox.checked;
    const privacyAccepted = privacyCheckbox.checked;

    /* ---------- BASIC VALIDATION ---------- */
    if (!email || !password || !country) {
      message.textContent = "All fields are required.";
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      message.textContent = "You must accept Terms and Privacy.";
      return;
    }

    try {
      /* ---------- 1. CREATE AUTH USER ---------- */
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password
        });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("User creation failed.");
      }

      const userId = authData.user.id;

      /* ---------- 2. INSERT USER PROFILE ---------- */
      const { error: profileError } = await supabase
        .from("users_profile")
        .insert({
          id: userId,
          email: email,
          full_name: "N/A",
          country: country,
          currency_code: "PHP",     // temporary (Phase 1.3 will improve this)
          currency_symbol: "₱"
        });

      if (profileError) throw profileError;

      /* ---------- 3. INSERT LEGAL ACCEPTANCE ---------- */
      const { error: legalError } = await supabase
        .from("legal_acceptance")
        .insert({
          user_id: userId,
          terms_accepted: true,
          privacy_accepted: true
        });

      if (legalError) throw legalError;

      message.textContent = "Account created successfully.";

    } catch (err) {
      message.textContent = err.message || "Signup failed.";
    }
  });
}
