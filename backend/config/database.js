import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hk-intertech',
      {
        serverSelectionTimeoutMS: Number(process.env.MONGO_SELECTION_TIMEOUT_MS || 10000),
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
        minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
        retryWrites: true,
        appName: 'hk-intertech-api',
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;