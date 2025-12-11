package com.sia.srms.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleAuthService {

    @Value("${google.clientIds:}")
    private String clientIdsProperty;

    // Backward-compatible single clientId (used if clientIdsProperty is empty)
    @Value("${google.clientId:}")
    private String singleClientId;

    private final JacksonFactory jacksonFactory = JacksonFactory.getDefaultInstance();

    public GoogleUser verifyToken(String idTokenString) {
        try {
            // Build audience list from comma-separated property or single clientId
            java.util.List<String> audience;
            if (clientIdsProperty != null && !clientIdsProperty.trim().isEmpty()) {
                audience = java.util.Arrays.stream(clientIdsProperty.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
            } else if (singleClientId != null && !singleClientId.isEmpty()) {
                audience = Collections.singletonList(singleClientId);
            } else {
                // Fallback to a hardcoded value only if nothing configured (dev-only)
                audience = Collections
                        .singletonList("188530738032-8mu3352c2ot2jvvgl7dklqgqgu7siedc.apps.googleusercontent.com");
            }

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(), jacksonFactory)
                    .setAudience(audience)
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                // Debug: print audience vs configured clientId to help diagnose mismatch
                Object aud = payload.getAudience();
                System.out.println("[GoogleAuthService] Configured audiences=" + audience + ", token audience=" + aud);
                GoogleUser user = new GoogleUser();
                user.setEmail(payload.getEmail());
                user.setName((String) payload.get("name"));
                return user;
            } else {
                System.out.println("[GoogleAuthService] Token verification returned null (invalid token or audience)");
                return null;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // DTO to hold Google user info
    public static class GoogleUser {
        private String email;
        private String name;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}