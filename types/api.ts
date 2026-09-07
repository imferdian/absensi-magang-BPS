export interface User {
  user_id: string;
  username: string;
  name: string;
  role: string;
}

export interface LoginData {
  token: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: LoginData;
}
