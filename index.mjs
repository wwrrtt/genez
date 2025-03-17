import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World from Express serverless!");
});

app.get("/users", (req, res) => {
  res.json([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]);
});

// route example with streaming

app.get("/stream", (req, res) => {
  // write a long string to the response
  const interval = setInterval(() => {
    res.write("Hello, World! ");
  }, 1000);

  // end the response after 5 seconds
  setTimeout(() => {
    clearInterval(interval);
    res.end();
  }, 5000);
});

app.listen(8080, () => {
  console.log(
    "Server is running on port 8080. Check the app on http://localhost:8080"
  );
});
