import { LoginResponse } from "../types/api";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwdErVuUB83YNZK-VigaKMdGA7cQzZqKyzP0I0mypkugTjdlyrPHfjlCp28wz4R7rTc/exec";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "login",
      username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error("Gagal menghubungi server");
  }

  return await response.json();
}

export async function chekcIn(token: string, latitude: number, longitude: number, photo: string) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'check_in',
      token,
      latitude,
      longitude,
      photo
    })
  });
}