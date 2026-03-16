/**
 * 感情記録日誌 - バックエンド (Code.gs)
 */

// スクリプトプロパティから安全にIDを読み込む
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SS_ID');

// Webページを表示する
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('感情ログ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 【重要】フロントエンドからのリクエストを受け取る新しい窓口
function doPostProxy(data) {
  const action = data.action;
  initializeDatabase();

  switch (action) {
    case 'register': return handleRegister(data);
    case 'login': return handleLogin(data);
    case 'addEntry': return handleAddEntry(data);
    case 'getEntries': return handleGetEntries(data);
    case 'getKeywords': return handleGetKeywords(data);
    case 'deleteEntry': return handleDeleteEntry(data);
    case 'validateActivationKey': return handleValidateActivationKey(data);
    default: return { success: false, message: 'Invalid action' };
  }
}

// データベース（シート）の初期化
function initializeDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss.getSheetByName('users')) {
    ss.insertSheet('users').appendRow(['email', 'password', 'name', 'registrationDate', 'isActivated', 'activationKey']);
  }
  if (!ss.getSheetByName('entries')) {
    ss.insertSheet('entries').appendRow(['email', 'timestamp', 'date', 'time', 'xValue', 'xKeyword', 'yValue', 'yKeyword', 'comment']);
  }
  if (!ss.getSheetByName('keywords')) {
    ss.insertSheet('keywords').appendRow(['email', 'type', 'keyword', 'count']);
  }
}

// ユーザー登録
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

// ログイン
function handleLogin(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('users');
  const users = sheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === data.email && users[i][1] === data.password) {
      const regDate = new Date(users[i][3]);
      const diffDays = Math.ceil(Math.abs(new Date() - regDate) / (1000 * 60 * 60 * 24));
      return {
        success: true, email: users[i][0], name: users[i][2],
        isActivated: users[i][4] === true,
        trialDaysRemaining: Math.max(0, 10 - diffDays),
        isTrialExpired: diffDays > 10
      };
    }
  }
  return { success: false, message: '認証に失敗しました' };
}

// 記録追加
function handleAddEntry(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('entries');
  sheet.appendRow([data.email, new Date().getTime(), data.date, data.time, data.xValue, data.xKeyword, data.yValue, data.yKeyword, '']);
  return { success: true };
}

// 記録取得
function handleGetEntries(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = ss.getSheetByName('entries').getDataRange().getValues();
  const entries = rows.filter(r => r[0] === data.email).map(r => ({
    date: r[2], time: r[3], xValue: r[4], xKeyword: r[5], yValue: r[6], yKeyword: r[7]
  }));
  return { success: true, entries: entries };
}

// アクティベーションキー検証
function handleValidateActivationKey(data) {
  if (data.activationKey && data.activationKey.length >= 16) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('users');
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.email) {
        sheet.getRange(i + 1, 5).setValue(true);
        return { success: true };
      }
    }
  }
  return { success: false, message: '無効なキーです' };
}
function testId() {
  // プロパティからIDを取得
  const id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  console.log("取得したID: " + id);

  try {
    // IDを使ってシートを開いてみる
    const ss = SpreadsheetApp.openById(id);
    console.log("接続成功！ シート名: " + ss.getName());
  } catch (e) {
    console.error("接続失敗：IDが間違っているか、権限がありません。");
    console.error("エラー内容: " + e.message);
  }
}