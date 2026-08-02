import bcrypt from "bcryptjs";

interface MockUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: "owner" | "partner";
  relationship: string;
  avatar_url: string | null;
  pair_id: string;
}

interface MockSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
}

interface MockSettings {
  id: string;
  user_id: string;
  pair_id: string;
  relationship_start_date: string | null;
  distance_km: string | null;
  next_meetup_date: string | null;
  secret_pin: string;
}

interface MockPresence {
  id: string;
  user_id: string;
  pair_id: string;
  status: string;
  last_seen: string;
}

type Row = Record<string, unknown>;

const users: MockUser[] = [];
const sessions: MockSession[] = [];
const settings: MockSettings[] = [];
const presence: MockPresence[] = [];
const extras: Row[] = [];
const chatMessages: Row[] = [];
const voiceNotes: Row[] = [];
const gameScores: Row[] = [];
const genericTables: Record<string, Row[]> = {};

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function seed() {
  if (users.length > 0) return;

  users.push({
    id: "user-1",
    username: "Ryo",
    password_hash: hashPassword("11122004"),
    name: "Ahmad Rio Prawiro",
    role: "owner",
    relationship: "Cowo Ara ❤️",
    avatar_url: null,
    pair_id: "pair-1",
  });

  users.push({
    id: "user-2",
    username: "Ara",
    password_hash: hashPassword("09062004"),
    name: "Tiara Pertiwi",
    role: "partner",
    relationship: "Cewe Rio ❤️",
    avatar_url: null,
    pair_id: "pair-1",
  });
}

seed();

function getTable(tableName: string): Row[] {
  const tableMap: Record<string, Row[]> = {
    users: users as unknown as Row[],
    sessions: sessions as unknown as Row[],
    user_settings: settings as unknown as Row[],
    ldr_presence: presence as unknown as Row[],
    user_extras: extras,
    chat_messages: chatMessages,
    voice_notes: voiceNotes,
    game_scores: gameScores,
  };
  if (!tableMap[tableName]) {
    if (!genericTables[tableName]) genericTables[tableName] = [];
    return genericTables[tableName];
  }
  return tableMap[tableName];
}

function parseTableName(sql: string): string {
  const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
  if (insertMatch) return insertMatch[1];

  const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
  if (updateMatch) return updateMatch[1];

  const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
  if (deleteMatch) return deleteMatch[1];

  const selectMatch = sql.match(/FROM\s+(\w+)/i);
  if (selectMatch) return selectMatch[1];

  return "";
}

function parseConditions(sql: string, params: unknown[]): Row | null {
  const whereMatch = sql.match(/WHERE\s+([\s\S]+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|\s+HAVING|$)/i);
  if (!whereMatch) return null;

  const conditions = whereMatch[1];
  const result: Row = {};

  const parts = conditions.split(/\s+AND\s+/i);
  for (const part of parts) {
    const eqMatch = part.match(/(\w+)\s*=\s*\$(\d+)/);
    if (eqMatch) {
      const col = eqMatch[1];
      const paramIdx = parseInt(eqMatch[2]) - 1;
      result[col] = params[paramIdx];
    }

    const gtMatch = part.match(/(\w+)\s*>\s*\$(\d+)/);
    if (gtMatch) {
      const col = gtMatch[1];
      const paramIdx = parseInt(gtMatch[2]) - 1;
      result[`__gt_${col}`] = params[paramIdx];
    }
  }

  return result;
}

function matchesRow(row: Row, conditions: Row | null): boolean {
  if (!conditions) return true;

  for (const [key, value] of Object.entries(conditions)) {
    if (key.startsWith("__gt_")) {
      const col = key.slice(5);
      const rowValue = row[col];
      if (rowValue === undefined || rowValue === null) return false;
      const rowDate = new Date(rowValue as string).getTime();
      const compareDate = new Date(value as string).getTime();
      if (rowDate <= compareDate) return false;
      continue;
    }

    if (key === "token") {
      if (row["token"] !== value) return false;
      continue;
    }

    if (row[key] !== value) return false;
  }

  return true;
}

export async function mockQuery(text: string, params?: unknown[]) {
  const sql = text.trim();
  const p = params || [];
  const tableName = parseTableName(sql);

  if (sql.toUpperCase().startsWith("INSERT")) {
    const table = getTable(tableName);
    const columnsMatch = sql.match(/\(([^)]+)\)\s*VALUES\s*\(([\s\S]+?)\)/i);
    if (columnsMatch) {
      const columns = columnsMatch[1].split(",").map((c) => c.trim());
      const row: Row = {};
      columns.forEach((col, i) => {
        row[col] = p[i];
      });
      table.push(row);
      return { rows: [row], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (sql.toUpperCase().startsWith("UPDATE")) {
    const table = getTable(tableName);
    const conditions = parseConditions(sql, p);
    const setMatch = sql.match(/SET\s+([\s\S]+?)(?:\s+WHERE)/i);
    const setClause = setMatch ? setMatch[1] : "";

    const setParts = setClause.split(",").map((s) => s.trim());
    const updateValues: Row = {};
    for (const part of setParts) {
      const match = part.match(/(\w+)\s*=\s*\$(\d+)/);
      if (match) {
        const col = match[1];
        const paramIdx = parseInt(match[2]) - 1;
        updateValues[col] = p[paramIdx];
      }
    }

    let updated = 0;
    for (const row of table) {
      if (matchesRow(row, conditions)) {
        Object.assign(row, updateValues);
        updated++;
      }
    }
    return { rows: [], rowCount: updated };
  }

  if (sql.toUpperCase().startsWith("DELETE")) {
    const table = getTable(tableName);
    const conditions = parseConditions(sql, p);
    const before = table.length;
    for (let i = table.length - 1; i >= 0; i--) {
      if (matchesRow(table[i], conditions)) {
        table.splice(i, 1);
      }
    }
    return { rows: [], rowCount: before - table.length };
  }

  if (sql.toUpperCase().startsWith("SELECT")) {
    const table = getTable(tableName);
    const conditions = parseConditions(sql, p);

    let results = table.filter((row) => matchesRow(row, conditions));

    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      results = results.slice(0, parseInt(limitMatch[1]));
    }

    return { rows: results, rowCount: results.length };
  }

  if (sql.toUpperCase().startsWith("CREATE") || sql.toUpperCase().startsWith("INSERT") && tableName === "users") {
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

export async function mockGetOne(text: string, params?: unknown[]) {
  const result = await mockQuery(text, params);
  return result.rows[0] || null;
}

export async function mockGetAll(text: string, params?: unknown[]) {
  const result = await mockQuery(text, params);
  return result.rows;
}

export async function mockInsert(text: string, params?: unknown[]) {
  const result = await mockQuery(text, params);
  return result.rows[0];
}

export async function mockUpdate(text: string, params?: unknown[]) {
  const result = await mockQuery(text, params);
  return result.rows[0];
}

export async function mockRemove(text: string, params?: unknown[]) {
  const result = await mockQuery(text, params);
  return result.rows;
}

export function mockGenerateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function mockInitializeDatabase() {
  seed();
}
