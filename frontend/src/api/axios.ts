import axios from "axios";

export const CHAVE_TOKEN = "darkmoon.token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  timeout: 10_000,
});

// Anexa o token em toda requisição, se o usuário estiver logado.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CHAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
