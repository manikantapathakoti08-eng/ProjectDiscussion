package com.example.skillSwap.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class PasswordDTOs {

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank
        @Email
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String otp;

        @NotBlank
        private String newPassword;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String oldPassword;

        @NotBlank
        private String newPassword;
    }
}
