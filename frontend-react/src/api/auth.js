import axios from "axios";

const client = axios.create({ baseURL: "http://localhost:8000" });

export const login = async (email, password) => {
  const response = await client.post("/auth/login", { email, password });
  return response.data;
};