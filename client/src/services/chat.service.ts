import API from "./api";

export const sendMessage = async (message: string) => {
  const res = await API.post("/chat/message", { message });
  return res.data.data;
};