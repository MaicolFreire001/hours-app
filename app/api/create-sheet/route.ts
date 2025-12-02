/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { google } from "googleapis";

type Interval = {
  in: string;
  out: string;
};

type DayEntry = {
  date: string;
  intervals: Interval[];
};

type RequestBody = {
  month: string;
  days: DayEntry[];
  tokens: any;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    const { days, month, tokens } = body;

    if (!days || !tokens) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const sheetTitle = `Horas - ${month}`;
    const fileRes = await drive.files.create({
      requestBody: {
        name: sheetTitle,
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
      fields: "id",
    });

    const spreadsheetId = fileRes.data.id!;
    const sheetName = "Hoja 1";

    const values: (string | number)[][] = [];
    values.push(["Fecha", "Hora ingreso", "Hora salida", "Horas trabajadas"]);

    let rowIndex = 2;

    days.forEach((day: DayEntry) => {
      day.intervals.forEach((int: Interval) => {
        values.push([
          day.date,
          int.in,
          int.out,
          `=IF(AND(B${rowIndex}<>\"\", C${rowIndex}<>\"\"), (C${rowIndex}-B${rowIndex})*24, "")`,
        ]);
        rowIndex++;
      });
    });

    const totalRow = rowIndex;
    values.push([
      "",
      "",
      "TOTAL:",
      `=SUM(D2:D${rowIndex - 1})`,
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:D${totalRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    return NextResponse.json({
      message: "Sheet created",
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    });

  } catch (error: any) {
    console.error("ERROR create-sheet:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
