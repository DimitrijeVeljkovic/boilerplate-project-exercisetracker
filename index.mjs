import express from "express";
import morgan from "morgan";
import bp from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { urlencoded, json } = bp;
const database = {
  users: [
    { id: 1, username: "Dimitrije" },
    { id: 2, username: "Veljkovic" },
  ],
  exersises: [],
  userExcerciseLogs: [],
};
const app = express();
dotenv.config();

app.use(cors());
app.use(express.static("public"));
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  //toDo: get from real database
  res.json(database.users);
});

app.post("/api/users", (req, res) => {
  const newUser = {
    id: +(Math.random() * 1000000).toFixed(0),
    username: req.body.username,
  };
  //toDo: insert into real database
  database.users.push(newUser);
  res.json(newUser);
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const _id = req.params._id ? +req.params._id : null;
  const description = req.body.description;
  const duration = req.body.duration ? +req.body.duration : null;
  const date = req.body.date;

  if (!description) {
    res.status(400).json("Description is required field!");
    return;
  }
  if (!duration || Number.isNaN(duration)) {
    res.status(400).json("Duration is required field and should be number!");
    return;
  }
  if (
    date &&
    !date.match(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/g)
  ) {
    res.status(400).json("Date does not match expected template!");
    return;
  }

  //toDo: read from real database
  if (database.users.some((user) => user.id === _id)) {
    const newExercise = {
      exerciseId: +(Math.random() * 1000000).toFixed(0),
      userId: _id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    };
    //toDo: insert into real database
    database.exersises.push(newExercise);
    res.json(newExercise);
  } else {
    res.status(404).json("Cannot find user with provided id");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
