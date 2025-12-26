"use server";

import { redirect } from "next/navigation";
import { ensureUser } from "@/server/auth/ensureUser";

export async function getConsentUrl(institutionId: string) {
  const apiKey = process.env.YAPILY_API_KEY;
  const apiSecret = process.env.YAPILY_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Yapily API key and secret are not configured.");
  }

  const user = await ensureUser();

  const callbackUrl =
    process.env.NODE_ENV === "production"
      ? "https://<your_production_app_url>/api/callback"
      : "http://localhost:3000/api/callback";

  const response = await fetch(
    "https://api.yapily.com/account-auth-requests",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      },
      body: JSON.stringify({
        userUuid: user.id,
        institutionId,
        callback: callbackUrl,
        // We can ask for account and transaction information
        feature_scope: ["ACCOUNT", "TRANSACTIONS"],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Error creating consent URL:", error);
    throw new Error("Could not create consent URL.");
  }

  const data = await response.json();
  const authorisationUrl = data.data.authorisationUrl;

  if (!authorisationUrl) {
    console.error("No authorisationUrl in response:", data);
    throw new Error("Could not create consent URL.");
  }

  redirect(authorisationUrl);
}
