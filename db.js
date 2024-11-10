import pg from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// database
const db = new pg.Pool({
  user: process.env.DB_USER || "your_database_user",
  host: process.env.DB_HOST || "your_database_host",
  database: process.env.DB_NAME || "your_database_name",
  password: process.env.DB_PASSWORD || "your_database_password",
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates (if applicable)
  },
});


export default db;
