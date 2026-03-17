import admin from 'firebase-admin';
import process from 'process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

class MockDocumentSnapshot {
  constructor(data) {
    this._data = data;
    this.exists = data !== undefined;
  }

  data() {
    return this._data;
  }
}

class MockQuerySnapshot {
  constructor(docs) {
    this.docs = docs.map((doc) => ({
      data: () => doc,
    }));
  }
}

class MockDocumentReference {
  constructor(store, collectionName, id) {
    this.store = store;
    this.collectionName = collectionName;
    this.id = id;
  }

  async set(data) {
    const collection = this.store.getCollection(this.collectionName);
    collection.set(this.id, structuredClone({ ...data, id: data.id ?? this.id }));
  }

  async update(updates) {
    const collection = this.store.getCollection(this.collectionName);
    const existing = collection.get(this.id);
    if (!existing) {
      throw new Error(`Document "${this.collectionName}/${this.id}" does not exist`);
    }

    collection.set(this.id, structuredClone({ ...existing, ...updates }));
  }

  async get() {
    const collection = this.store.getCollection(this.collectionName);
    return new MockDocumentSnapshot(collection.get(this.id));
  }
}

class MockQuery {
  constructor(store, collectionName, clauses = [], order = null, limitValue = null) {
    this.store = store;
    this.collectionName = collectionName;
    this.clauses = clauses;
    this.order = order;
    this.limitValue = limitValue;
  }

  where(field, operator, value) {
    return new MockQuery(this.store, this.collectionName, [...this.clauses, { field, operator, value }], this.order, this.limitValue);
  }

  orderBy(field, direction = 'asc') {
    return new MockQuery(this.store, this.collectionName, this.clauses, { field, direction }, this.limitValue);
  }

  limit(value) {
    return new MockQuery(this.store, this.collectionName, this.clauses, this.order, Number(value));
  }

  doc(id) {
    return new MockDocumentReference(this.store, this.collectionName, id);
  }

  async get() {
    let docs = [...this.store.getCollection(this.collectionName).values()];

    for (const clause of this.clauses) {
      docs = docs.filter((doc) => {
        const current = doc?.[clause.field];
        switch (clause.operator) {
          case '==':
            return current === clause.value;
          case '>=':
            return current >= clause.value;
          default:
            throw new Error(`Unsupported mock where operator: ${clause.operator}`);
        }
      });
    }

    if (this.order) {
      const direction = this.order.direction === 'desc' ? -1 : 1;
      docs.sort((a, b) => {
        const left = a?.[this.order.field];
        const right = b?.[this.order.field];
        if (left === right) return 0;
        if (left === undefined) return 1;
        if (right === undefined) return -1;
        return left > right ? direction : -direction;
      });
    }

    if (typeof this.limitValue === 'number' && !Number.isNaN(this.limitValue)) {
      docs = docs.slice(0, this.limitValue);
    }

    return new MockQuerySnapshot(docs);
  }
}

class MockFirestoreStore {
  constructor() {
    this.collections = new Map();
  }

  getCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }

    return this.collections.get(name);
  }
}

class MockFirestore {
  constructor() {
    this.store = new MockFirestoreStore();
  }

  collection(name) {
    return new MockQuery(this.store, name);
  }

  settings() {
    return undefined;
  }
}

function initializeFirebase() {
  const serviceAccountPath = resolve('./serviceAccountKey.json');

  try {
    const serviceAccount = loadServiceAccount(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID ?? serviceAccount.project_id,
    });

    console.log('Firebase initialized with real credentials');
    return {
      adminApp: admin,
      db: admin.firestore(),
      realtimeDb: safeAccess(() => admin.database(), 'Realtime Database not configured. Using Firestore only.'),
      auth: safeAccess(() => admin.auth(), 'Authentication not configured.'),
      isMock: false,
      configSource: process.env.FIREBASE_CLIENT_EMAIL ? 'env' : 'serviceAccountKey.json',
    };
  } catch (error) {
    console.warn('serviceAccountKey.json not found. Using in-memory mock services for local development.');
    const mockDb = new MockFirestore();
    return {
      adminApp: null,
      db: mockDb,
      realtimeDb: null,
      auth: null,
      isMock: true,
      configSource: 'mock',
    };
  }
}

function loadServiceAccount(serviceAccountPath) {
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
}

function safeAccess(factory, message) {
  try {
    return factory();
  } catch (error) {
    console.warn(message);
    return null;
  }
}

const firebase = initializeFirebase();

export const db = firebase.db;
export const realtimeDb = firebase.realtimeDb;
export const auth = firebase.auth;
export const isMockFirebase = firebase.isMock;
export const firebaseConfigSource = firebase.configSource;

if (!isMockFirebase && typeof db.settings === 'function') {
  db.settings({ ignoreUndefinedProperties: true });
}

export default firebase.adminApp ?? admin;
