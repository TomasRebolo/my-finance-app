"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/server/db/prisma";
import Papa from "papaparse";

export async function importCsv(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to import a CSV.");
  }

  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file uploaded.");
  }

  const fileContent = await file.text();

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // TODO: Let user map columns
          // TODO: Validate data
          const transactions = results.data.map((row: any) => ({
            // This is an example mapping, it will need to be adjusted
            description: row.Description,
            amount: parseFloat(row.Amount),
            date: new Date(row.Date),
            // TODO: associate with an account
          }));

          // Just logging for now, will insert into DB later
          console.log(transactions);

          resolve({ success: true, message: "CSV imported successfully." });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
}
