/* eslint-disable no-var */
import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidding-bot'; // Use environment variable with fallback

let client;
let clientPromise: Promise<MongoClient>;

// In production mode, it's best to not use a global variable.
// But in development mode, using a global variable is convenient
// so that the client is not recreated on each hot reload

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect().then(client => {
      console.log('MongoDB connected successfully (development)');
      return client;
    }).catch(err => {
      console.error('MongoDB connection error (development):', err);
      throw err;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect().then(client => {
    console.log('MongoDB connected successfully (production)');
    return client;
  }).catch(err => {
    console.error('MongoDB connection error (production):', err);
    throw err;
  });
}

export default clientPromise; 