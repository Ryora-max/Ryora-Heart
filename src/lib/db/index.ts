import { query as pgQuery, getOne as pgGetOne, getAll as pgGetAll, insert as pgInsert, update as pgUpdate, remove as pgRemove, generateId as pgGenerateId } from "./postgres";
import { mockQuery, mockGetOne, mockGetAll, mockInsert, mockUpdate, mockRemove, mockGenerateId, mockInitializeDatabase } from "./mock";
import { initializeDatabase as pgInit } from "./init";

const useMock = !process.env.DATABASE_URL;

export const query = useMock ? mockQuery : pgQuery;
export const getOne = useMock ? mockGetOne : pgGetOne;
export const getAll = useMock ? mockGetAll : pgGetAll;
export const insert = useMock ? mockInsert : pgInsert;
export const update = useMock ? mockUpdate : pgUpdate;
export const remove = useMock ? mockRemove : pgRemove;
export const generateId = useMock ? mockGenerateId : pgGenerateId;
export const dbInsert = insert;
export const dbUpdate = update;
export const dbRemove = remove;
export const initializeDatabase = useMock ? mockInitializeDatabase : pgInit;
