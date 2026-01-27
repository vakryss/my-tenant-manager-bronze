import { supabase } from "./supabase.js";

/* =========================
   REQUIRE AUTH SESSION
   - Used on protected pages
   - Redirects immediately if not authenticated
========================= */
export async function requireAuth() {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.replace("/login.html");
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.replace("/login.html");
  }
}

/* =========================
   LOGOUT
   - Ends session cleanly
   - Redirects to login
========================= */
export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    window.location.replace("/login.html");
  }
}
