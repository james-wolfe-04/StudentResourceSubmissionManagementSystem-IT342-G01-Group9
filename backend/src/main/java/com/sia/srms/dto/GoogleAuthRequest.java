package com.sia.srms.dto;

public class GoogleAuthRequest {
    private String idToken;
    private Boolean asTeacher;

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public Boolean getAsTeacher() {
        return asTeacher;
    }

    public void setAsTeacher(Boolean asTeacher) {
        this.asTeacher = asTeacher;
    }
}