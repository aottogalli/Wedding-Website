// src/lib/sheets.js
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getServiceAccountFromEnv() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');

    let json;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }

    // Normalize private_key newlines if they’re escaped
    if (json.private_key && typeof json.private_key === 'string') {
        json.private_key = json.private_key.replace(/\\n/g, '\n');
    }
    return json;
}

export async function getSheets() {
    const sa = getServiceAccountFromEnv();
    const auth = new google.auth.JWT({
        email: sa.client_email,
        key: sa.private_key,
        scopes: SCOPES,
    });
    await auth.authorize();
    return google.sheets({ version: 'v4', auth });
}

export async function getRows(sheets) {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error('Missing SPREADSHEET_ID');

    // A:AD covers up to dietary column AC (index 28)
    const range = 'Guest List!A2:AD';
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return res.data.values || [];
}
