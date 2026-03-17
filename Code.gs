/**
 * 感情記録日誌 - バックエンド (Code.gs)
 */

const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SS_ID');

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('感情ログ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPostProxy(data) {
  const action = data.action;
  initializeDatabase();

  switch (action) {
    case 'register': return handleRegister(data);
    case 'login': return handleLogin(data);
    case 'addEntry': return handleAddEntry(data);
    case 'getEntries': return handleGetEntries(data);
    default: return { success: false, message: 'Invalid action' };
  }
}

function initializeDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss.getSheetByName('users')) {
    ss.insertSheet('users').appendRow(['email', 'password', 'name', 'registrationDate', 'isActivated', 'activationKey']);
  }
  if (!ss.getSheetByName('entries')) {
    ss.insertSheet('entries').appendRow(['email', 'timestamp', 'date', 'time', 'xValue', 'xKeyword', 'yValue', 'yKeyword', 'comment']);
  }
}

function handleAddEntry(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('entries');
  // コメントを含めて保存
  sheet.appendRow([data.email, new Date().getTime(), data.date, data.time, data.xValue, data.xKeyword, data.yValue, data.yKeyword, data.comment]);
  return { success: true };
}

function handleGetEntries(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = ss.getSheetByName('entries').getDataRange().getValues();
  // ヘッダーを除外してフィルタリング
  const entries = rows.slice(1).filter(r => r[0] === data.email).map(r => ({
    date: r[2], time: r[3], xValue: r[4], xKeyword: r[5], yValue: r[6], yKeyword: r[7], comment: r[8]
  }));
  return { success: true, entries: entries };
}

function handleRegister(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('users');
  const users = sheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === data.email) return { success: false, message: '登録済みのアドレスです' };
  }
  sheet.appendRow([data.email, data.password, data.name, new Date(), false, '']);
  return { success: true };
}

function handleLogin(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('users');
  const users = sheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === data.email && users[i][1] === data.password) {
      return { success: true, email: users[i][0], name: users[i][2] };
    }
  }
  return { success: false, message: '認証に失敗しました' };
}