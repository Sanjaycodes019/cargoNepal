const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('MONGO_URI is not defined!');
      console.error('Please check your .env file and make sure MONGO_URI is set.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('Make sure MongoDB is running and the connection string is correct.');
    process.exit(1);
  }
};

module.exports = connectDB;

