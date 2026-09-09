function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8,
  );

  return rawHash
    .map((byte) => {
      const value = byte < 0 ? byte + 256 : byte;
      return value.toString(16).padStart(2, "0");
    })
    .join("");
}

function generateToken() {
  return (
    Utilities.getUuid().replace(/-/g, "") +
    Utilities.getUuid().replace(/-/g, "")
  );
}

function createSession(user) {
  const token = generateToken();

  const session = {
    user_id: user.user_id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  CacheService.getScriptCache().put(
    `session_${token}`,
    JSON.stringify(session),
    21600,
  );

  return token;
}

function getSession(token) {
  if (!token) {
    return null;
  }

  const value = CacheService.getScriptCache().get(`session_${token}`);

  if (!value) {
    return null;
  }

  return JSON.parse(value);
}

function createPasswordHash() {
  const password = "pass123456";

  Logger.log(hashPassword(password));
}

function requireAuth(data) {
  if (!data.token) {
    return {
      success: false,
      response: jsonResponse({
        success: false,
        message: "Token wajib diisi",
      }),
    };
  }

  const session = getSession(data.token);

  if (!session) {
    return {
      success: false,
      response: jsonResponse({
        success: false,
        message: "Token tidak valid atau sudah expired",
      }),
    };
  }

  return {
    success: true,
    session: session,
  };
}
