import React, { useEffect, useRef } from "react";
import api from "../api/axios";

// Renders a Google Sign-In button and exchanges the credential with backend
export default function GoogleLogin({ asTeacher = false, onLoginSuccess, onError }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!window.google || !clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp) => {
        try {
          const idToken = resp?.credential;
          if (!idToken) return;
          const { data } = await api.post("/auth/google", { idToken, asTeacher });
          const { user, token, mustSetPassword } = data || {};
          if (user && token) {
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("token", token);
            onLoginSuccess?.({ user, token, mustSetPassword: !!mustSetPassword });
          }
        } catch (err) {
          const msg = err?.response?.data?.message || "Google login failed";
          console.error("Google login failed", err);
          if (typeof onError === "function") onError(msg);
          else alert(msg);
        }
      },
    });

    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: asTeacher ? "continue_with" : undefined,
      });
    }
  }, [asTeacher]);

  return <div ref={buttonRef} />;
}