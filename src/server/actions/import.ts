"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/server/db/prisma";
import Papa from "papaparse";
import * as xlsx from "xlsx";

export async function importFile(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to import a file.");
  }

  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file uploaded.");
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  if (fileExtension === "csv") {
    return importCsv(file);
  } else if (fileExtension === "xlsx" || fileExtension === "xls") {
    return importXls(file);
  } else {
    throw new Error("Unsupported file type.");
  }
}

async function importCsv(file: File) {
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

async function importXls(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = xlsx.read(arrayBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  // Assuming the first row is the header
  const header: string[] = data[0] as string[];
  const rows = data.slice(1);

  const transactions = rows.map((row: any) => {
    const transaction: { [key: string]: any } = {};
    header.forEach((h, i) => {
      transaction[h] = row[i];
    });
    return {
      // This is an example mapping, it will need to be adjusted
      description: transaction.Description,
      amount: parseFloat(transaction.Amount),
      date: new Date(transaction.Date),
      // TODO: associate with an account
    };
  });

  // Just logging for now, will insert into DB later
  console.log(transactions);

  return { success: true, message: "XLS imported successfully." };
}
