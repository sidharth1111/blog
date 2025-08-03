import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "http://localhost:4001";

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => res.render("home.ejs"));

app.get("/posts", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
    return res.render("index.ejs", { posts: response.data });
  } catch (error) {
    res.status(500).json({ message: "Failed to load posts" });
  }
});

app.get("/new", (req, res) => {
  res.render("modify.ejs", { heading: "New Post", submit: "Create Post" });
});

app.get("/edit/:id", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts/${req.params.id}`);
    res.render("modify.ejs", {
      heading: "Edit Post",
      submit: "Update Post",
      post: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
});

app.post("/api/posts", async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/posts`, req.body);
    res.redirect("/posts");
  } catch (error) {
    res.status(500).json({ message: "Error creating post" });
  }
});

app.post("/api/posts/:id", async (req, res) => {
  try {
    const response = await axios.patch(
      `${API_URL}/posts/${req.params.id}`,
      req.body
    );
      res.redirect("/posts");
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
});

app.get("/api/posts/delete/:id", async (req, res) => {
  try {
    await axios.delete(`${API_URL}/posts/${req.params.id}`);
      res.redirect("/posts");
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/register`, req.body);
    if (response.status === 201) {
      return res.redirect("/");
    }
  } catch (error) {
    if (error.response?.status === 400) {
      return res.send("Email already exists. Try logging in.");
    } else {
      res.status(500).send("Registration failed.");
    }

  }
});

app.post("/login", async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/login`, req.body);
    if (response.status == 201) {
      const posts = await axios.get(`${API_URL}/posts`);
      return res.render("index.ejs", { posts: posts.data });
    }
  }
  catch(error) {
    if (error.response?.status === 400) {
      res.send("Incorrect password, try again.");
    }
    else if (error.response?.status === 401) {
      res.send("Email doesn't exist.");
    }
    else {
      res.status(500).send("Login failed.");
    }
  }
});
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
