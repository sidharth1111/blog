
import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";

env.config();

const app = express();
const port = 4001;
const saltRounds = 10;

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.POSTGRE_PORT,
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
app.get("/posts", async (req, res) => {
  try {
    const dbRes = await db.query("SELECT * FROM blogs ORDER BY id ASC");
    res.json(dbRes.rows);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching posts" });
  }
});


// Get a single blog post by ID
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const result = await db.query("SELECT * FROM blogs WHERE id = $1", [id], (err, dbRes) => {
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
      res.json({ message: "Post deleted successfully" });
    }
  );
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({message: "Email already registered. Try logging in."});
    } 
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
      } else {
      await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, hash]
      );
      res.status(201).json({ message: "User registered successfully" });
    }
  });
  } catch (err) {
    res.status(500).json({ message: "Registeration failed." });
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const loginPassword = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      const password = user.password;

      bcrypt.compare(loginPassword, password, (err, result) => {
        if (err) {
          console.error("Error comparing passwords:", err);
        } else {
          if (result) {
            return res.status(201).json({message: "Log in successful."});
          } else {
            return res.status(400).json({message: "Incorrect password."});
          }
        }
      });
    }
    else {
      return res.status(401).json({message: "Email not found."});
    }
  } catch (err) {
    res.status(500).json({message: "Error logging in."})
  }
});

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
