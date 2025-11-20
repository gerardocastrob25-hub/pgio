// Load environment variables
require('dotenv').config();
console.log("DATABASE_URL from env:", process.env.DATABASE_URL);

// Required packages
const express = require("express");
const app = express();
app.set("view engine", "ejs");

const multer = require("multer");
const upload = multer();

const { Pool } = require("pg");

// Create connection pool to Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2
});

// ---------- HOME ROUTE: LIST PRODUCTS ----------
app.get("/", async (req, res) => {
  try {
    const sql = "SELECT * FROM PRODUCT ORDER BY PROD_ID";
    const result = await pool.query(sql);

    res.render("index", {
      message: "success",
      model: result.rows
    });
  } catch (err) {
    console.error("DB ERROR on / route:", err);
    res.render("index", {
      message: `Error - ${err.message}`,
      model: []
    });
  }
});

// ---------- INPUT PAGE ----------
app.get("/input", (req, res) => {
  res.render("input");
});

// Handle file upload and insert into DB
app.post("/input", upload.single("filename"), async (req, res) => {
  if (!req.file || Object.keys(req.file).length === 0) {
    return res.send("Error: Import file not uploaded");
  }

  const buffer = req.file.buffer;
  const lines = buffer.toString().split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;
    const product = line.split(",");
    const sql =
      "INSERT INTO PRODUCT(prod_id, prod_name, prod_desc, prod_price) VALUES($1,$2,$3,$4)";

    try {
      await pool.query(sql, product);
      console.log("Inserted:", product);
    } catch (err) {
      console.error("Insert error:", err.message);
    }
  }

  res.send(`Processing Complete - Processed ${lines.length} lines`);
});

// ---------- OUTPUT PAGE ----------
app.get("/output", (req, res) => {
  res.render("output", { message: "" });
});

// Export all products to CSV
app.post("/output", async (req, res) => {
  try {
    const sql = "SELECT * FROM PRODUCT ORDER BY PROD_ID";
    const result = await pool.query(sql);

    let output = "";
    result.rows.forEach((product) => {
      output += `${product.prod_id},${product.prod_name},${product.prod_desc},${product.prod_price}\r\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("export.csv");
    return res.send(output);
  } catch (err) {
    console.error("DB ERROR on /output:", err);
    res.render("output", { message: `Error - ${err.message}` });
  }
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
