require("dotenv").config();
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("✅ Connected to database!");

    const res = await client.query("SELECT * FROM PRODUCT ORDER BY PROD_ID");
    console.log("Rows from PRODUCT:", res.rows);

  } catch (err) {
    console.error("❌ DB connection or query error:", err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

main();
