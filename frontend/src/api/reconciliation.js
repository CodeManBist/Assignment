import { api } from "./client.js";

export async function signup(email, password) {
  const { data } = await api.post("/auth/signup", { email, password });
  return data; // { access_token, token_type }
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function listBatches() {
  const { data } = await api.get("/batches");
  return data;
}

export async function uploadBatch(ordersFile, paymentsFile) {
  const form = new FormData();
  form.append("orders_file", ordersFile);
  form.append("payments_file", paymentsFile);
  const { data } = await api.post("/batches/upload", form);
  return data;
}

export async function getDashboard(batchId) {
  const { data } = await api.get(`/batches/${batchId}/dashboard`);
  return data;
}

export async function getDiscrepancies(batchId, { discrepancy_type, severity, search } = {}) {
  const { data } = await api.get(`/batches/${batchId}/discrepancies`, {
    params: { discrepancy_type, severity, search },
  });
  return data;
}

export async function explainDiscrepancies(batchId, discrepancyIds) {
  const { data } = await api.post(`/batches/${batchId}/explain`, {
    discrepancy_ids: discrepancyIds,
  });
  return data;
}
