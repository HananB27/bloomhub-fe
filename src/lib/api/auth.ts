import { API_BASE_URL } from "../config";

export interface LoginCredentials {
  email: string;
  password?: string;
  provider?: "email" | "google" | "microsoft";
  token?: string; // For OAuth
}

export interface RegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  avatarFile?: File; // Native upload
  provider?: "email" | "google" | "microsoft";
  providerAvatarUrl?: string; // Fallback from provider
}

const handleApiError = async (response: Response, defaultMessage: string) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || defaultMessage);
  }
  return response.json();
};

export const loginWithEmail = async (credentials: LoginCredentials) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  return handleApiError(response, "Failed to log in");
};

const buildRegistrationFormData = (payload: RegistrationPayload): FormData => {
  const formData = new FormData();
  formData.append("first_name", payload.firstName);
  formData.append("last_name", payload.lastName);
  formData.append("email", payload.email);

  if (payload.password) {
    formData.append("password", payload.password);
  }

  if (payload.provider) {
    formData.append("provider", payload.provider);
  }

  if (payload.avatarFile) {
    formData.append("avatar", payload.avatarFile);
  } else if (payload.providerAvatarUrl) {
    formData.append("provider_avatar_url", payload.providerAvatarUrl);
  }

  return formData;
};

export const registerUser = async (payload: RegistrationPayload) => {
  const formData = buildRegistrationFormData(payload);

  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: "POST",
    body: formData, // Sending as FormData to support file upload
  });

  return handleApiError(response, "Failed to register account");
};

export const logoutUser = async (refreshToken?: string) => {
  if (refreshToken) {
    // Attempt to blacklist the refresh token on the backend
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch (e) {
      console.error("Logout API failed", e);
    }
  }
};
