import { type NextRequest, NextResponse } from "next/server";

import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";

import clientPromise from '@/lib/mongodb';

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");

async function getExcelHeaders(buffer: Buffer): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  
  const worksheet = workbook.getWorksheet(1); // Get first worksheet
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }

  const headerRow = worksheet.getRow(1);
  if (!headerRow || !Array.isArray(headerRow.values) || headerRow.values.length <= 1) {
    throw new Error('No header row found in Excel file');
  }

  // Remove index 0 (null) and convert to strings
  const headers = headerRow.values.slice(1).map(cell => {
    if (cell && typeof cell === 'object' && 'text' in cell) {
      return cell.text as string;
    }
    return String(cell || '').trim();
  });

  return headers;
}

export async function POST(request: NextRequest) {
    const formData = await request.formData();

     const file = formData.get("file") as File;
     if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
     }

    const buffer = Buffer.from(await file.arrayBuffer()) as Buffer;

    try {
        const client = await clientPromise;
        const db = client.db('bidding-bot');
        const collection = db.collection('broker');

        const headers = await getExcelHeaders(buffer);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error('No worksheet found in Excel file');
        }

        const lastRow = worksheet.lastRow?.number || 0
        const rows = worksheet.getRows(2, lastRow - 1)?.map((row: ExcelJS.Row) => {
            const r = {};

            for (let i = 0; i < headers.length; i++) {
                const column = headers[i];

                (r as any)[column] = row?.getCell(i + 1)?.value;
            }

            return r;
        })

        await collection.insertMany(rows || []);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Invalid file format" }, { status: 400 });
    }
}