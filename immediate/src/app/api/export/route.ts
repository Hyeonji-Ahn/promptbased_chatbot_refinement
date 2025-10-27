import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function formatDateDot(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function getAuth() {
  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ];
  if (process.env.GCP_SA_JSON) {
    const creds = JSON.parse(process.env.GCP_SA_JSON);
    return new google.auth.GoogleAuth({ credentials: creds, scopes });
  }
  return new google.auth.GoogleAuth({ scopes });
}

// Sheet titles cannot contain: : \ / ? * [ ]
function sanitizeSheetTitle(raw: string) {
  const cleaned = raw.replace(/[:\\/\\?\\*\\[\\]]/g, '-').trim();
  return cleaned.slice(0, 90);
}

async function ensureUniqueSheetTitle(
  sheetsApi: any,
  spreadsheetId: string,
  baseTitle: string
): Promise<{ title: string }> {
  const meta = await sheetsApi.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(title))',
  });
  const titles = new Set<string>(
    (meta.data.sheets || [])
      .map((s: any) => s.properties?.title)
      .filter(Boolean)
  );

  if (!titles.has(baseTitle)) return { title: baseTitle };

  for (let i = 2; i < 1000; i++) {
    const candidate = `${baseTitle} (${i})`.slice(0, 100);
    if (!titles.has(candidate)) return { title: candidate };
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return { title: `${baseTitle} ${ts}`.slice(0, 100) };
}

export async function POST(req: NextRequest) {
  try {
    const { username, chatPairs, date, spreadsheetId: bodySpreadsheetId } = await req.json();
    if (!username || !Array.isArray(chatPairs)) {
      return NextResponse.json({ error: 'username and chatPairs[] required' }, { status: 400 });
    }

    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    const exportDate = date || formatDateDot(new Date());
    const baseTitle = sanitizeSheetTitle(`${username} ${exportDate}`);
    const configuredSpreadsheetId = bodySpreadsheetId || process.env.GOOGLE_SHEET_ID;

    let spreadsheetId = configuredSpreadsheetId as string | undefined;
    let createdNewFile = false;

    if (!spreadsheetId) {
      // Fallback: create a new spreadsheet (requires Drive space)
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      const fileName = `${baseTitle} Chat Export`;
      const createResp = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          ...(folderId ? { parents: [folderId] } : {}),
        },
        supportsAllDrives: true,
        fields: 'id',
      });
      spreadsheetId = createResp.data.id!;
      createdNewFile = true;
    }

    const values: (string[])[] = [
      ['user name', 'date'],
      [username, exportDate],
      ...chatPairs.map((p: any) => [p.user ?? '', p.bot ?? '']),
    ];

    if (configuredSpreadsheetId) {
      // Append as a new tab to existing Sheet
      const { title } = await ensureUniqueSheetTitle(sheets, configuredSpreadsheetId, baseTitle);

      // 1) Add sheet
      const addResp = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: configuredSpreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title } } }] },
      });
      const newSheetId: number =
        addResp.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;

      // 2) Write values
      await sheets.spreadsheets.values.update({
        spreadsheetId: configuredSpreadsheetId,
        range: `${title}!A1:B${values.length}`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      // 3) Freeze + autosize
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: configuredSpreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: { sheetId: newSheetId, gridProperties: { frozenRowCount: 2 } },
                fields: 'gridProperties.frozenRowCount',
              },
            },
            {
              autoResizeDimensions: {
                dimensions: { sheetId: newSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 2 },
              },
            },
          ],
        },
      });

      const webUrl = `https://docs.google.com/spreadsheets/d/${configuredSpreadsheetId}`;
      return NextResponse.json({
        ok: true,
        spreadsheetId: configuredSpreadsheetId,
        sheetTitle: title,
        webUrl,
        mode: 'appended-tab',
      });
    }

    // Created a new file (fallback)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!,
      range: `Sheet1!A1:B${values.length}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId!,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId: 0, gridProperties: { frozenRowCount: 2 } },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 2 },
            },
          },
        ],
      },
    });

    const webUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return NextResponse.json({
      ok: true,
      spreadsheetId,
      webUrl,
      mode: createdNewFile ? 'created-file' : 'updated-default',
    });
  } catch (err: any) {
    console.error('Export failed:', err?.response?.data || err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
