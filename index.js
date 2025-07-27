
import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import pg from "pg";

env.config();

const app = express();
const port = 4001;

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});
db.connect();

// Create blogs table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Error creating blogs table:", err.stack);
  } else {
    console.log("Blogs table is ready.");
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Get all blog posts
app.get("/posts", (req, res) => {
  db.query("SELECT * FROM blogs ORDER BY id ASC", (err, dbRes) => {
    if (err) return res.status(500).json({ message: "Error fetching posts" });
    res.json(dbRes.rows);
  });
});


// Get a single blog post by ID
app.get("/posts/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM blogs WHERE id = $1", [id], (err, dbRes) => {
    if (err) return res.status(500).json({ message: "Error fetching post" });
    if (dbRes.rows.length === 0) return res.status(404).json({ message: "Post not found" });
    res.json(dbRes.rows[0]);
  });
});


// Create a new blog post
app.post("/posts", (req, res) => {
  const { title, content, author } = req.body;
  db.query(
    "INSERT INTO blogs (title, content, author, date) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, content, author, new Date()],
    (err, dbRes) => {
      if (err) return res.status(500).json({ message: "Error creating post" });
      res.status(201).json(dbRes.rows[0]);
    }
  );
});


// Update an existing blog post
app.patch("/posts/:id", (req, res) => {
  const { title, content, author } = req.body;
  const { id } = req.params;
  db.query(
    "UPDATE blogs SET title = $1, content = $2, author = $3 WHERE id = $4 RETURNING *",
    [title, content, author, id],
    (err, dbRes) => {
      if (err) return res.status(500).json({ message: "Error updating post" });
      if (dbRes.rows.length === 0) return res.status(404).json({ message: "Post not found" });
      res.json(dbRes.rows[0]);
    }
  );
});


// Delete a blog post
app.delete("/posts/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "DELETE FROM blogs WHERE id = $1 RETURNING *",
    [id],
    (err, dbRes) => {
      if (err) return res.status(500).json({ message: "Error deleting post" });
      if (dbRes.rows.length === 0) return res.status(404).json({ message: "Post not found" });
      res.json({ message: "Post deleted" });
    }
  );
});

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
