import React, { useEffect, useRef } from "react";
import api from "../api/axios";

// Renders a Google Sign-In button and exchanges the credential with backend
export default function GoogleLogin({ asTeacher = false, onLoginSuccess, onError }) {
  const buttonRef = useRef(null);
  // Keep latest callbacks without re-initializing Google every render
  const successRef = useRef(onLoginSuccess);
  const errorRef = useRef(onError);

  // Sync refs when props change
  useEffect(() => {
    successRef.current = onLoginSuccess;
    errorRef.current = onError;
  }, [onLoginSuccess, onError]);

  useEffect(() => {
    const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    // Debug: confirm the runtime client ID matches your .env value
    console.log('CLIENT_ID (runtime)', CLIENT_ID);
    if (!window.google || !CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      ux_mode: "popup",
      allowed_parent_origin: [window.location.origin],
      callback: async (resp) => {
        try {
          const idToken = resp?.credential;
          if (!idToken) return;
          const { data } = await api.post("/auth/google", { idToken, asTeacher });
          const { user, token, mustSetPassword } = data || {};
          if (user && token) {
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("token", token);
            successRef.current?.({ user, token, mustSetPassword: !!mustSetPassword });
          }
        } catch (err) {
          const msg = err?.response?.data?.message || "Google login failed";
          console.error("Google login failed", err);
          if (typeof errorRef.current === "function") errorRef.current(msg);
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