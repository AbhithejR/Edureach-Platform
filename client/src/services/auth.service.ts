import API from "./api";

// Backend response shape:
// Register/Login: { success, message, data: { token, user: { id, name, email, phone } } }
// GetMe:          { success, data: { user: { id, name, email, phone, created_at } } }
//
// axios res.data gives us the outer object
// We return res.data.data to get { token, user } or { user }

export const registerUser = async (data: { name: string; email: string; password: string; phone?: string }) => {
  const res = await API.post("/auth/register", data);
  return res.data.data; // { token, user }
};

export const loginUser = async (data: { email: string; password: string }) => {
  const res = await API.post("/auth/login", data);
  return res.data.data; // { token, user }
};

export const getMe = async () => {
  const res = await API.get("/auth/me");
  return res.data.data; // { user }
};












