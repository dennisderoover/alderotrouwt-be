require('dotenv').config();

const { google } = require('googleapis');
const express = require('express');
const app = express();
const port = 3000;

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const googleSheetId = process.env.GOOGLE_SHEET_ID;
const googleSheetPage = process.env.GOOGLE_SHEET_PAGE_NAME;

// authenticate the service account
const googleAuth = new google.auth.JWT(
    clientEmail,
    null,
    privateKey.replace(/\\n/g, '\n'),
    'https://www.googleapis.com/auth/spreadsheets'
);

async function readSheet() {
  try {
    // google sheet instance
    const sheetInstance = await google.sheets({ version: 'v4', auth: googleAuth});
    // read data in the range in a sheet
    const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
        auth: googleAuth,
        spreadsheetId: googleSheetId,
        range: `${googleSheetPage}!A1:E8`
    });
    
    const valuesFromSheet = infoObjectFromSheet.data.values;
    console.log(valuesFromSheet);
  }
  catch(err) {
    console.log("readSheet func() error", err);  
  }
}

app.get('/fetch', (req, res) => {
  res.send('Loaded Google Sheet ...');
  readSheet();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});