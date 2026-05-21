import { getCookie } from "@/lib/utils";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function ChangePassword(
  payload: ChangePasswordPayload
) {
  const token = getCookie("edu_token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(
    `${BASE_URL}/users/change-password`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  // ✅ lire le body
  const data = await response.json();

  // ✅ backend error
  if (!response.ok) {
    throw new Error(data.message);
  }

  // ✅ success message backend
  return data;
}