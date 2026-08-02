/* eslint-disable @typescript-eslint/no-explicit-any */

// Supabase REST API client — works over HTTPS (IPv4 compatible)
// Replaces direct pg Postgres connection which requires IPv6 on Vercel Hobby

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function baseUrl() {
  return `${SUPABASE_URL}/rest/v1`;
}

export function isSupabaseConfigured() {
  return !!SUPABASE_URL && !!SUPABASE_KEY;
}

// Select rows from a table
export async function select(table: string, filters?: Record<string, any>, options?: { order?: string; limit?: number; ascending?: boolean }) {
  let url = `${baseUrl()}/${table}?select=*`;
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        url += `&${key}=eq.${encodeURIComponent(String(value))}`;
      }
    }
  }
  if (options?.order) {
    url += `&order=${options.order}.${options.ascending ? "asc" : "desc"}`;
  }
  if (options?.limit) {
    url += `&limit=${options.limit}`;
  }
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Supabase select error: ${res.status} ${await res.text()}`);
  return res.json();
}

// Insert a row
export async function insertRow(table: string, data: Record<string, any>) {
  const res = await fetch(`${baseUrl()}/${table}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase insert error: ${res.status} ${await res.text()}`);
  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

// Update rows
export async function updateRow(table: string, filters: Record<string, any>, data: Record<string, any>) {
  let url = `${baseUrl()}/${table}?select=*`;
  for (const [key, value] of Object.entries(filters)) {
    url += `&${key}=eq.${encodeURIComponent(String(value))}`;
  }
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase update error: ${res.status} ${await res.text()}`);
  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

// Upsert a row
export async function upsertRow(table: string, data: Record<string, any>, conflictColumn?: string) {
  let url = `${baseUrl()}/${table}`;
  const h = headers();
  if (conflictColumn) {
    h["Prefer"] = "return=representation,resolution=merge-duplicates";
    url += `?on_conflict=${conflictColumn}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: h,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase upsert error: ${res.status} ${await res.text()}`);
  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

// Delete rows
export async function deleteRow(table: string, filters: Record<string, any>) {
  let url = `${baseUrl()}/${table}?select=*`;
  for (const [key, value] of Object.entries(filters)) {
    url += `&${key}=eq.${encodeURIComponent(String(value))}`;
  }
  const res = await fetch(url, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase delete error: ${res.status} ${await res.text()}`);
  return res.json();
}

// Get a single row
export async function selectOne(table: string, filters: Record<string, any>) {
  const rows = await select(table, filters, { limit: 1 });
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// Generate ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
