import React, { useEffect } from "react";
import api from "../api/axios";

export default function GoogleLogin({ onLoginSuccess, asTeacher = false }) {
  useEffect(() => {
    // keep latest asTeacher on a global so the Google callback can read the latest value
    window._googleAsTeacher = asTeacher;
    console.log("GoogleLogin: asTeacher set to", asTeacher);

    if (!window || !window.google) {
      console.error("Google Identity Services script not loaded");
      return;
    }
    // Only initialize the Google SDK once; still update the global flag above when prop changes
    if (window._googleIdentityInitialized) {
      return;
    }
    window._googleIdentityInitialized = true;

    const handleCredentialResponse = async (response) => {
      const idToken = response.credential;
      try {
        // read current asTeacher value from global (ensures latest checkbox state is used)
        const asTeacherFlag = Boolean(window._googleAsTeacher);
        console.log("Google callback: asTeacherFlag =", asTeacherFlag);

        const payload = { idToken, asTeacher: asTeacherFlag };
        console.log("GoogleLogin -> sending payload:", payload);

        const res = await api.post("/auth/google", payload);
        console.log("GoogleLogin -> backend response:", res.data);

        const { user, token, mustSetPassword } = res.data;

        // Save token for authenticated requests
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Notify parent with mustSetPassword flag
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess(user, mustSetPassword);
        }
      } catch (err) {
        console.error("Backend error:", err, err?.response?.data);
      }
    };

    try {
      window.google.accounts.id.initialize({
        client_id: "188530738032-8mu3352c2ot2jvvgl7dklqgqgu7siedc.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      });

      const btn = document.getElementById("googleSignInDiv");
      if (btn) {
        window.google.accounts.id.renderButton(btn, { theme: "outline", size: "large" });
      }

      window.google.accounts.id.prompt();
    } catch (e) {
      console.error("Google Identity init error:", e);
    }
  }, [onLoginSuccess, asTeacher]);  // keep dependency so global is updated when asTeacher changes

  return <div id="googleSignInDiv"></div>;
}