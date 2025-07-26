import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 4001;

let posts = [
  {
    id: 1,
    title: "My Journey to Building a Personal Project",
    content:
      "Today, I embarked on my journey to build a personal project from scratch. The goal is to create a simple blog API using Node.js and Express.",
    author: "Sidharth",
    date: new Date().toISOString(),
  },
  {
    id: 2,
    title: "More things incoming soon",
    content:
      "Stay tuned for more updates on my personal project. Exciting features and improvements are on the way!",
    author: "Sidharth",
    date: new Date().toISOString(),
  },
];

let lastId = 3;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/posts", (req, res) => {
  console.log(posts);
  res.json(posts);
});

app.get("/posts/:id", (req, res) => {
  const post = posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json(post);
});

app.post("/posts", (req, res) => {
  const newPost = {
    id: ++lastId,
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    date: new Date(),
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

app.patch("/posts/:id", (req, res) => {
    const post = posts.find(post => post.id === parseInt(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (req.body.title) post.title = req.body.title;
    if (req.body.content) post.content = req.body.content;
    if (req.body.author) post.author = req.body.author;

  res.json(post);
});
app.delete("/posts/:id", (req, res) => {
  const idx = posts.findIndex(post => post.id === parseInt(req.params.id));
  if (idx == -1) return res.status(404).json({ message: "Post not found" });

    posts.splice(idx, 1);
    res.json({ message: "Post deleted" });
});

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
