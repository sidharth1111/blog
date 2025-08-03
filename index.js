
import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

env.config();

const app = express();
const port = 4001;
const saltRounds = 10;

mongoose.connect(`mongodb://localhost:${process.env.MONGO_PORT}/blog`)

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const Blog = mongoose.model("Blog", blogSchema);

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", UserSchema);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Get all blog posts
app.get("/posts", async (req, res) => {
  try {
    const dbRes = await Blog.find();
    res.json(dbRes);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching posts" });
  }
});


// Get a single blog post by ID
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Blog.find({_id: id});
    if (result.length === 0) return res.status(404).json({ message: "Post not found" });
    res.json(result[0]);
  }
  catch (err) {
    if (err) return res.status(500).json({ message: "Error fetching post" });
  }
});


// Create a new blog post
app.post("/posts", async (req, res) => {
  const { title, content, author } = req.body;
  try {
    const newPost = await Blog.create({ title, content, author });
    return res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (err) {
    return res.status(500).json({ message: "Error creating post" });
  }
});


// Update an existing blog post
app.patch("/posts/:id", async (req, res) => {
  const { title, content, author } = req.body;
  const { id } = req.params;

  try {
    await Blog.updateOne({_id: id}, {$set: {title, content, author}});
    return res.status(200).json({ message: "Post updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Error updating post" });
  }
});


// Delete a blog post
app.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Blog.deleteOne({_id: id});
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Error deleting post" });
  }
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const checkResult = await User.findOne({ email });
    if (checkResult) {
      return res.status(400).json({ message: "Email already registered. Try logging in." });
    }
    const hash = await bcrypt.hash(password, saltRounds);
    try {
      await User.create({ email, password: hash });
      await User.find();
      return res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Error creating user:", err);
      return res.status(500).json({ message: "Registration failed." });
    }

  } catch (err) {
    console.error("Error in registration route:", err);
    return res.status(500).json({ message: "Registration failed." });
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const loginPassword = req.body.password;
  try {
    const checkResult = await User.findOne({ email });
    if (checkResult) {
      const user = checkResult;
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
