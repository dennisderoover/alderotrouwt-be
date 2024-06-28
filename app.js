require('dotenv').config();

const express = require('express');
const cors = require('cors'); 

const { google } = require('googleapis');

const port = process.env.PORT || 4500;

const app = express();
app.use(cors());

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

const Activity = {
  ANTWERP: 'antwerp',
  CEREMONY: 'ceremony',
  DINER: 'diner',
  PARTY: 'party',
};

function mapToGoogleSheetResult(valuesFromSheet) {
  // Extract the headers
  const [headers, ...rows] = valuesFromSheet;

  // Map the rows to GoogleSheetsResult-like objects
  const dataObjects = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  // Transform the data objects to Guest objects
  const guests = dataObjects.map(line => ({
    id: Number(line.id), // Convert id to number
    firstName: line.firstName,
    lastName: line.lastName,
    householdId: Number(line.householdId), // Convert householdId to number
    invitedFor: line.invitedFor ? line.invitedFor.replace(/ /g, '').split(',').map(activity => {
      switch (activity.toLowerCase()) {
        case 'antwerp': return Activity.ANTWERP;
        case 'ceremony': return Activity.CEREMONY;
        case 'diner': return Activity.DINER;
        case 'party': return Activity.PARTY;
        default: throw new Error(`Unknown activity: ${activity}`);
      }
    }): [] // Convert invitedFor to Activity[]
  }));

  return guests;
}

async function readSheet() {
  try {
    // google sheet instance
    const sheetInstance = await google.sheets({ version: 'v4', auth: googleAuth});
    // read data in the range in a sheet
    const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
        auth: googleAuth,
        spreadsheetId: googleSheetId,
        range: `${googleSheetPage}!A1:E101`
    });
    
    const valuesFromSheet = infoObjectFromSheet.data.values;
    return valuesFromSheet;
  }
  catch(err) {
    console.log("readSheet func() error", err);  
  }
}

app.get('/fetch', (req, res) => {
  readSheet().then(result => {
    const guests = mapToGoogleSheetResult(result);
    res.send(guests)
  })
});

app.listen(port, () => {
  console.log(`aldertrouwt_backend listening on port ${port}`)
});