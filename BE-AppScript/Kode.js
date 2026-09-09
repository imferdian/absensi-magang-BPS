const CONFIG = {
  SPREADSHEET_ID: "1nU3K1g4kpx1RA-qepKka1EIS9nWBity4r_AdVuyNWJ8",
  DRIVE_FOLDER_NAME: "Absensi Peserta Magang BPS",
  TIMEZONE: "Asia/Makassar",
};

function testAccess() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  Logger.log(spreadsheet.getName());
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

const usersSheet = getSheet("Users");
const attendanceSheet = getSheet("Attendance");

function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case "history":
        return handleHistory(e);

      case "today":
        return handleToday(e);

      default:
        return jsonResponse({
          success: true,
          message: "Absensi API is Running",
        });
    }
  } catch (err) {
    return jsonResponse({
      success: false,
      message: error.message,
    });
  }
}

// Post Check in dan Check Out
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.action) {
      return jsonResponse({
        success: false,
        message: "Action is required",
      });
    }

    switch (data.action) {
      case "login":
        return handleLogin(data);

      case "check_in":
        return handleCheckIn(data);

      case "check_out":
        return handleCheckOut(data);

      default:
        return jsonResponse({
          success: false,
          message: "Unknown action",
        });
    }
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message,
    });
  }
}

// Mendapatkan User
function findUser(userId) {
  const sheet = getSheet("Users");
  const values = sheet.getDataRange().getValues();

  const headers = values.shift();

  const userIdIndex = headers.indexOf("user_id");

  for (const row of values) {
    if (String(row[userIdIndex]) === String(userId)) {
      const user = {};

      headers.forEach((header, index) => {
        user[header] = row[index];
      });

      return user;
    }
  }

  return null;
}

// Generate ID Kehadiran
function generateAttendanceId() {
  return "ATT-" + Utilities.getUuid();
}

// Menghitung Jarak Lokasi GPS
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

// Membaca Settings Absensi
function getSettings() {
  const sheet = getSheet("Settings");
  const values = sheet.getDataRange().getValues();

  const settings = {};

  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    const value = values[i][1];

    settings[key] = value;
  }

  return settings;
}

const settings = getSettings();

// Membuat Folder Drive Absensi
function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(name);
}

// Membuat Folder Drive Khusus Tanggal Absensi
function getOrCreateDateFolder(date) {
  const parent = getOrCreateFolder(CONFIG.DRIVE_FOLDER_NAME);

  const folderName = Utilities.formatDate(date, CONFIG.TIMEZONE, "yyyy-MM-dd");

  const folders = parent.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parent.createFolder(folderName);
}

// Upload foto dalam bentuk Base64
function uploadPhoto(base64Data, fileName, mimeType, date) {
  const folder = getOrCreateDateFolder(date);

  const base64 = base64Data.split(",")[1];

  const bytes = Utilities.base64Decode(base64);

  const blob = Utilities.newBlob(bytes, mimeType, fileName);

  const file = folder.createFile(blob);

  return file.getUrl();
}

// Check In
function handleCheckIn(data) {
  const auth = requireAuth(data);

  if (!auth.success) {
    return auth.response;
  }

  const session = auth.session;

  const userId = session.user_id;

  const user = findUser(userId);

  if (!user) {
    return jsonResponse({
      success: false,
      message: "User tidak ditemukan",
    });
  }

  if (String(user.active).toUpperCase() !== "TRUE") {
    return jsonResponse({
      success: false,
      message: "User tidak aktif",
    });
  }

  const settings = getSettings();

  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return jsonResponse({
      success: false,
      message: "Lokasi tidak valid",
    });
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    Number(settings.office_latitude),
    Number(settings.office_longitude),
  );

  if (distance > Number(settings.allowed_radius)) {
    return jsonResponse({
      success: false,
      message: "Anda berada di luar area absensi",
      distance: Math.round(distance),
    });
  }

  const sheet = getSheet("Attendance");

  const now = new Date();

  const date = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd");

  const existing = findAttendance(userId, date);

  if (existing) {
    return jsonResponse({
      success: false,
      message: "Anda sudah melakukan absensi masuk hari ini",
    });
  }

  const photoUrl = uploadPhoto(
    data.photo,
    `${user.user_id}_check_in_${date}.jpg`,
    "image/jpeg",
    now,
  );

  const attendanceId = generateAttendanceId();

  sheet.appendRow([
    attendanceId,
    user.user_id,
    user.name,
    date,
    now,
    "",
    latitude,
    longitude,
    Math.round(distance),
    photoUrl,
    "",
    "",
    "",
    "",
    "Hadir",
    now,
    now,
  ]);

  return jsonResponse({
    success: true,
    message: "Absensi masuk berhasil",
    data: {
      attendance_id: attendanceId,
      name: user.name,
      date: date,
      check_in: now.toISOString(),
      distance: Math.round(distance),
      photo_url: photoUrl,
    },
  });
}

// Mengubah objek date menjadi string JSON
function formatDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, "yyyy-MM-dd");
  }

  return String(value);
}

function formatDateTime(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  }

  return String(value);
}

// Mendapatkan Absensi
function findAttendance(userId, date) {
  const sheet = getSheet("Attendance");
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();

  const userIdIndex = headers.indexOf("user_id");
  const dateIndex = headers.indexOf("date");
  const timezone = CONFIG.TIMEZONE;

  for (const row of values) {
    let rowDateStr = row[dateIndex];
    if (rowDateStr instanceof Date) {
      rowDateStr = Utilities.formatDate(rowDateStr, timezone, "yyyy-MM-dd");
    }

    if (
      String(row[userIdIndex]).trim() === String(userId).trim() &&
      rowDateStr === date
    ) {
      const attendance = {};
      headers.forEach((header, index) => {
        attendance[header] = row[index];
      });
      return attendance;
    }
  }

  return null;
}

// Check Out
function handleCheckOut(data) {
  const auth = requireAuth(data);

  if (!auth.success) {
    return auth.response;
  }

  const session = auth.session;

  const userId = session.user_id;

  const user = findUser(userId);

  if (!user) {
    return jsonResponse({
      success: false,
      message: "User tidak ditemukan",
    });
  }

  const settings = getSettings();

  const now = new Date();

  const date = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd");

  const attendance = findAttendance(userId, date);

  if (!attendance) {
    return jsonResponse({
      success: false,
      message: "Anda belum melakukan absensi masuk",
    });
  }

  if (attendance.check_out) {
    return jsonResponse({
      success: false,
      message: "Anda sudah melakukan absensi pulang",
    });
  }

  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);

  const distance = calculateDistance(
    latitude,
    longitude,
    Number(settings.office_latitude),
    Number(settings.office_longitude),
  );

  if (distance > Number(settings.allowed_radius)) {
    return jsonResponse({
      success: false,
      message: "Anda berada di luar area absensi",
      distance: Math.round(distance),
    });
  }

  const photoUrl = uploadPhoto(
    data.photo,
    `${user.user_id}_check_out_${date}.jpg`,
    "image/jpeg",
    now,
  );

  updateCheckOut(
    data.user_id,
    date,
    now,
    latitude,
    longitude,
    Math.round(distance),
    photoUrl,
  );

  return jsonResponse({
    success: true,
    message: "Absensi pulang berhasil",
    data: {
      date: date,
      check_out: now.toISOString(),
      distance: Math.round(distance),
      photo_url: photoUrl,
    },
  });
}

// Update Untuk data Check Out
function updateCheckOut(
  userId,
  date,
  checkOut,
  latitude,
  longitude,
  distance,
  photoUrl,
) {
  const sheet = getSheet("Attendance");
  const values = sheet.getDataRange().getValues();

  const headers = values[0];

  const userIdIndex = headers.indexOf("user_id");
  const dateIndex = headers.indexOf("date");

  const checkOutIndex = headers.indexOf("check_out");
  const latIndex = headers.indexOf("check_out_lat");
  const lngIndex = headers.indexOf("check_out_lng");
  const distanceIndex = headers.indexOf("check_out_distance");
  const photoIndex = headers.indexOf("check_out_photo");
  const updatedIndex = headers.indexOf("updated_at");
  const timezone = CONFIG.TIMEZONE;

  for (let i = 1; i < values.length; i++) {
    let rowDate = values[i][dateIndex];
    if (rowDate instanceof Date) {
      rowDate = Utilities.formatDate(rowDate, timezone, "yyyy-MM-dd");
    }

    if (
      String(values[i][userIdIndex]).trim === String(userId).trim &&
      rowDate === date
    ) {
      const row = i + 1;

      sheet.getRange(row, checkOutIndex + 1).setValue(checkOut);
      sheet.getRange(row, latIndex + 1).setValue(latitude);
      sheet.getRange(row, lngIndex + 1).setValue(longitude);
      sheet.getRange(row, distanceIndex + 1).setValue(distance);
      sheet.getRange(row, photoIndex + 1).setValue(photoUrl);
      sheet.getRange(row, updatedIndex + 1).setValue(new Date());

      return true;
    }
  }
  return false;
}

function handleHistory(e) {
  const token = e.parameter.token;

  if (!token) {
    return jsonResponse({
      success: false,
      messsage: "Token wajid diisi",
    });
  }

  const session = getSession(token);

  if (!session) {
    return jsonResponse({
      success: false,
      message: "Token tidak valid atau kadaluarsa",
    });
  }

  const userId = session.user_id;

  const sheet = getSheet("Attendance");

  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return jsonResponse({
      success: true,
      data: [],
    });
  }

  const rows = values.slice(1);

  const history = rows
    .filter((row) => {
      return String(row[1]) === String(userId);
    })
    .map((row) => {
      return {
        attendance_id: row[0],
        user_id: row[1],
        name: row[2],
        date: formatDate(row[3]),
        check_in: row[4],
        check_out: row[5],
        latitude: row[6],
        longitude: row[7],
        distance: row[8],
        check_in_photo: row[9],
        check_out_photo: row[13],
        status: row[14],
      };
    })
    .reverse();

  return jsonResponse({
    success: true,
    data: history,
  });
}

function findUserByUsername(username) {
  const sheet = getSheet("Users");

  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return null;
  }

  const rows = values.slice(1);

  for (const row of rows) {
    if (
      String(row[2]).trim().toLowerCase() ===
      String(username).trim().toLowerCase()
    ) {
      return {
        user_id: row[0],
        name: row[1],
        username: row[2],
        password_hash: row[3],
        role: row[4],
        active: row[5],
      };
    }
  }
  return null;
}

function handleLogin(data) {
  const username = data.username;
  const password = data.password;

  if (!username || !password) {
    return jsonResponse({
      success: false,
      message: "Username dan password wajib di isi",
    });
  }

  const user = findUserByUsername(username);

  if (!user) {
    return jsonResponse({
      success: false,
      message: "Username salah",
    });
  }

  if (String(user.active).toUpperCase() !== "TRUE") {
    return jsonResponse({
      success: false,
      message: "Akun tidak aktif",
    });
  }

  const passwordHash = hashPassword(password);

  if (passwordHash !== user.password_hash) {
    return jsonResponse({
      success: false,
      message: "Password salah",
    });
  }

  const token = createSession(user);

  return jsonResponse({
    success: true,
    message: "Login Berhasil",
    data: {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    },
  });
}

function handleToday(e) {
  const token = e.parameter.token;

  if (!token) {
    return jsonResponse({
      success: false,
      message: "Token wajib di isi",
    });
  }

  const session = getSession(token);

  if (!session) {
    return jsonResponse({
      success: false,
      message: "Token tidak valid atau kadaluarsa",
    });
  }

  const userId = session.user_id;

  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  const attendance = findAttendance(userId, today);

  if (!attendance) {
    return jsonResponse({
      success: true,
      data: {
        has_attendance: false,
        date: today,
        check_in: null,
        check_out: null,
        status: "Belum absen",
      },
    });
  }

  const checkIn = attendance.check_in;
  const checkOut = attendance.check_out;

  let status = "Sedang Berkerja";

  if (checkIn && checkOut) {
    status = "selesai";
  }

  return jsonResponse({
    success: true,
    data: {
      has_attendance: true,
      attendance_id: attendance.attendance_id,
      data: today,
      check_in: formatDateTime(checkIn),
      check_out: formatDateTime(checkOut),
      status,
      check_in_photo: attendance.check_in_photo || null,
      check_out_photo: attendance.check_out_photo || null,
    },
  });
}
