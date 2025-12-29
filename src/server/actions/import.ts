"use server";

import { currentUser } from "@clerk/nextjs/server";
import Papa from "papaparse";
import * as xlsx from "xlsx";

type CsvRow = {
  Description: string;
  Amount: string | number;
  Date: string;
};

type XlsCell = string | number | null;

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
    Papa.parse<CsvRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<CsvRow>) => {
        try {
          // TODO: Let user map columns
          // TODO: Validate data
          const transactions = results.data.map((row) => {
            const amountValue = row.Amount;
            const amount =
              typeof amountValue === "number"
                ? amountValue
                : parseFloat(amountValue);

            // This is an example mapping, it will need to be adjusted
            return {
              description: row.Description,
              amount,
              date: new Date(row.Date),
              // TODO: associate with an account
            };
          });

          // Just logging for now, will insert into DB later
          console.log(transactions);

          resolve({ success: true, message: "CSV imported successfully." });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Papa.ParseError) => {
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
  const data = xlsx.utils.sheet_to_json<XlsCell[]>(worksheet, { header: 1 });

  // Assuming the first row is the header
  const header = (data[0] || []) as XlsCell[];
  const rows = data.slice(1) as XlsCell[][];

  const transactions = rows.map((row) => {
    const transaction: Record<string, XlsCell> = {};

    header.forEach((h, i) => {
      if (typeof h === "string") {
        transaction[h] = row[i] ?? null;
      }
    });

    const descriptionValue = transaction.Description;
    const amountValue = transaction.Amount;
    const dateValue = transaction.Date;

    const description =
      typeof descriptionValue === "string" ? descriptionValue : "";
    const amount =
      typeof amountValue === "number"
        ? amountValue
        : parseFloat(String(amountValue ?? "0"));
    const date = new Date(String(dateValue ?? ""));

    return {
      // This is an example mapping, it will need to be adjusted
      description,
      amount,
      date,
      // TODO: associate with an account
    };
  });

  // Just logging for now, will insert into DB later
  console.log(transactions);

  return { success: true, message: "XLS imported successfully." };
}
