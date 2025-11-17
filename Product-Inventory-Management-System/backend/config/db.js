const mongoose = require('mongoose');

let memoryServer;

const connectWithUri = async (uri) => {
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

const startInMemoryMongo = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: process.env.MONGO_IN_MEMORY_DB || 'product_inventory'
    }
  });

  const uri = memoryServer.getUri();
  await connectWithUri(uri);
  console.log('Using in-memory MongoDB instance for development.');
};

const connectDB = async () => {
  const envHasMongoUri = Boolean(process.env.MONGO_URI);
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/product_inventory';

  const shouldForceMemory =
    process.env.USE_IN_MEMORY_DB === 'true' ||
    (!envHasMongoUri && process.env.NODE_ENV !== 'production');

  if (shouldForceMemory) {
    try {
      await startInMemoryMongo();
      return;
    } catch (error) {
      console.error(
        `Failed to boot in-memory MongoDB instance: ${error.message}`
      );
      process.exit(1);
    }
  }

  try {
    await connectWithUri(mongoUri);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      process.exit(1);
    }

    console.warn(
      `Primary MongoDB connection failed (${error.message}). Falling back to in-memory MongoDB for development.`
    );

    try {
      await startInMemoryMongo();
    } catch (memoryError) {
      console.error(
        `Failed to boot in-memory MongoDB instance: ${memoryError.message}`
      );
      process.exit(1);
    }
  }
};

const stopInMemoryMongo = async () => {
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = connectDB;
module.exports.stopInMemoryMongo = stopInMemoryMongo;
