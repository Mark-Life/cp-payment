// takes data JSON file and adds it to your Google Spreadsheet

function doPost(e) {
  var sheet = SpreadsheetApp.openById('Your_Spread_Sheet_ID').getSheetByName('Your_Sheet_Name'); // Change your Spreadsheet ID and Sheet Name
  var rowData = [];
  rowData.push(new Date()); // Add date and time of data sending

  var postData = JSON.parse(e.postData.contents);
  
  // add data from the form to the rowData array
  rowData.push(postData.email);
  rowData.push(postData.firstName);
  rowData.push(postData.lastName);
  rowData.push(postData.amount);
  rowData.push(postData.url_link);
  rowData.push(postData.parameterName); // Change parameterName to be the same as in main.js at the data object

  
  // Writing data to Google Spreadsheet
  sheet.appendRow(rowData);
  
  return ContentService.createTextOutput('The data was successfully added to the Google Spreadsheet');
}
