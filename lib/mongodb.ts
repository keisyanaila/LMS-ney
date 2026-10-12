import { MongoClient, type Db } from "mongodb";

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient> | undefined;

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return Promise.reject(
      new Error("MONGODB_URI belum diisi di .env.local")
    );
  }

  if (process.env.NODE_ENV === "development") {
    // Simpan di global supaya koneksi tidak dibuat ulang setiap HMR
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = new MongoClient(uri).connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }

  // Kalau koneksi gagal, reset supaya request berikutnya mencoba lagi
  const promise = clientPromise;
  promise.catch(() => {
    if (globalWithMongo._mongoClientPromise === promise) {
      globalWithMongo._mongoClientPromise = undefined;
    }
    if (clientPromise === promise) {
      clientPromise = undefined;
    }
  });

  return promise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB ?? "lms_ney");
}
