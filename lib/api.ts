const API_URL =
  "https://script.google.com/macros/s/AKfycbwlFhcGod4Phh6cFimGnMKhSDeQ5HZ5Ywq-Z8qHXvYzEJvYZVHcztQzFE-jLIlT8zlb/exec";

export type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: { user_id: string; username: string; name: string; role: string };
  };
};

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  if (!r.ok) throw new Error("Gagal menghubungi server");
  return r.json();
}

export async function getToday(token: string) {
  const r = await fetch(
    `${API_URL}?action=today&token=${encodeURIComponent(token)}`,
  );
  if (!r.ok) throw new Error("Gagal memuat data hari ini");
  return r.json();
}

export async function getHistory(token: string) {
  const r = await fetch(
    `${API_URL}?action=history&token=${encodeURIComponent(token)}`,
  );
  if (!r.ok) throw new Error("Gagal memuat riwayat");
  return r.json();
}

export async function checkIn(
  token: string,
  latitude: number,
  longitude: number,
  photo: string,
) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "check_in",
      token,
      latitude,
      longitude,
      photo,
    }),
  });
  return r.json();
}

export async function checkOut(
  token: string,
  latitude: number,
  longitude: number,
  photo: string,
) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "check_out",
      token,
      latitude,
      longitude,
      photo,
    }),
  });
  return r.json();
}
