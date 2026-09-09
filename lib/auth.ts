import * as SecureStore from "expo-secure-store";
import { User } from "../types/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export async function saveUser(user: User) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<User | null> {
  const user = await SecureStore.getItemAsync(USER_KEY);
  if (!user) return null;
  return JSON.parse(user);
}

export async function removeUser() {
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
