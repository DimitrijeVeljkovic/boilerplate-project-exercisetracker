import express from "express";
import morgan from "morgan";
import bp from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { CREATE_TABLE_EXERCISE, CREATE_TABLE_USER } from "./constants.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { urlencoded, json } = bp;
const app = express();

// Creation of database
const database = new sqlite3.Database(
  "./database.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.log(err);
    }
  }
);
database.run(CREATE_TABLE_USER);
database.run(CREATE_TABLE_EXERCISE);

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
  const sqlQuery = "SELECT id, username FROM User";
  database.all(sqlQuery, (err, rows) => {
    if (err) {
      res.status(500).json("Server error. Cannot read from database.");
      return;
    }
    res.json(rows);
  });
});

app.post("/api/users", (req, res) => {
  if (!req.body.username) {
    res.status(400).json("Userame is required field!");
    return;
  }

  const newUser = {
    id: +(Math.random() * 1000000).toFixed(0),
    username: req.body.username,
  };
  const sqlQuery = "INSERT INTO User(id, username) VALUES (?,?)";
  database.run(sqlQuery, [newUser.id, newUser.username], (err) => {
    if (err) {
      res.status(500).json("Server error. Cannot insert into database.");
      return;
    }
    res.json(newUser);
  });
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

  const sqlSelectQuery = "SELECT id, username FROM User WHERE id = ?";
  database.all(sqlSelectQuery, [_id], (err, rows) => {
    if (err) {
      res.status(500).json("Server error. Cannot read from database.");
      return;
    }
    if (rows.length === 0) {
      res.status(404).json("Cannot find user with provided id");
      return;
    }

    const newExercise = {
      exerciseId: +(Math.random() * 1000000).toFixed(0),
      userId: _id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    };
    const sqlInsertQuery =
      "INSERT INTO Excercise(id, description, duration, date, userId) VALUES (?, ?, ?, ?, ?)";
    database.run(
      sqlInsertQuery,
      [
        newExercise.exerciseId,
        newExercise.description,
        newExercise.duration,
        newExercise.date,
        newExercise.userId,
      ],
      (err) => {
        if (err) {
          res.status(500).json("Server error. Cannot insert into database.");
          return;
        }
        res.json(newExercise);
      }
    );
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;

  if (
    (from &&
      !from.match(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/g)) ||
    (to && !to.match(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/g))
  ) {
    res.status(400).json("From or To date does not match expected template!");
    return;
  }

  if (from && to && new Date(from) > new Date(to)) {
    res.status(400).json("From date must be before To date");
    return;
  }

  const fromQuery = from ? `AND date >= ${Date.parse(from)}` : "";
  const toQuery = to ? `AND date <= ${Date.parse(to)}` : "";

  const query = `SELECT e.id, e.description, e.duration, e.date, e.userId, u.username
                 FROM Excercise e INNER JOIN User u ON e.userId = u.id
                 WHERE u.id = ${req.params._id} ${fromQuery} ${toQuery}`;

  database.all(query, (err, rows) => {
    if (err) {
      res.status(500).json("Server error. Cannot read from database.");
      return;
    }
    if (rows.length === 0) {
      res.status(404).json("Cannot find logs for given criteria.");
      return;
    }

    const allRows = rows.map((row) => ({
      id: row.id,
      description: row.description,
      duration: row.duration,
      date: new Date(row.date),
    }));

    const result = {
      id: rows[0].userId,
      username: rows[0].username,
      logs: limit ? allRows.slice(0, limit) : allRows,
      count: rows.length,
    };

    res.json(result);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
