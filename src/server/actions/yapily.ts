"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers"; // Added import
import { ensureUser } from "@/server/auth/ensureUser";

export async function getConsentUrl(institutionId: string) {
  const apiKey = process.env.YAPILY_API_KEY;
  const apiSecret = process.env.YAPILY_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Yapily API key and secret are not configured.");
  }

  const user = await ensureUser();

  // --- START OF CHANGES ---
  // Get the headers from the current request
  const headersList = await headers();
  const host = headersList.get("host"); // e.g. "localhost:3000" or "your-app.ngrok-free.app"
  
  // Detect protocol (http vs https)
  // ngrok forwards 'x-forwarded-proto', so we trust that if it exists.
  const protocol = headersList.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  
  // Construct the base URL dynamically
  const baseUrl = `${protocol}://${host}`;
  const callbackUrl = `${baseUrl}/api/callback`;
  // --- END OF CHANGES ---

  const response = await fetch(
    "https://api.yapily.com/account-auth-requests",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      },
      body: JSON.stringify({
        applicationUserId: user.id,
        institutionId,
        callback: callbackUrl, // Using the dynamic URL here
        featureScope: ["ACCOUNT", "TRANSACTIONS"],
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