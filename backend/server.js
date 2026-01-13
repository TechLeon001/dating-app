const express = require("express");
const mongoose = require("mongoose");
const  dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

// load environment variables
dotenv.config();

//import routes

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const messageRoutes = require("./routes/message");
const matchRoutes = require("./routes/match");
const discoveryRoutes = require("./routes/discovery");


// import middleware

const errormiddleware = require("./middleware/errorMiddleware");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// socket.io logic

io.on("connection", (socket) => {
  console.log("New client connected");

  // join a room based on user ID for private messaging
  socket.on("register", (userId) => {
    socket.join(userId);
  });

//handle sending messages
  socket.on("sendMessage", (message) => {
    const { to } = message;
    io.to(to).emit("receiveMessage", message);
  });

    socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// make io accessible to routes
app.set("io", io);

//middelwares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes middleware
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/discovery", discoveryRoutes);

//error handling middleware
app.use(errormiddleware);

//connect to database and start server
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });