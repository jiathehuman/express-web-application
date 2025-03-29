/**
 * This application is developed as fulfilment of CM3010: Database and Advanced Data Techniques, midterms assignment.
 * Student number: 220516639
 */

// Express is a Node JS Web application framework that provides features for web development
const express = require("express");
// Body Parser library handles incoming data in different formats (eg. JSON)
const bodyParser = require("body-parser");
// MySQL used for the database in this project
const mysql = require("mysql2");
// DotEnv module loads environment from .env into process .env, reading key-value pairs and seeting them as env vars
const env = require("dotenv").config();

const app = express(); // instantiate Express
const port = 3000; // Port at 3000

app.set("view engine", "ejs"); // Set the templating engine to EJS
app.set("views", "./views"); // Set the templates to the views folder
app.use(bodyParser.urlencoded({ extended: true })); // Body parser
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css")); // Set path to Bootstrap library

// Question: Start the Mysql instace and create a connection with the variables set in .env file
global.db = mysql.createConnection({
  host: env.parsed.HOST,
  user: env.parsed.USER_NAME,
  password: env.parsed.PASSWORD,
  database: env.parsed.DATABASE,
});

// Question: Render the Index page upon starting the app
app.get("/", (req, res) => {
  res.render("index");
});

// Get all sports
app.get("/sports", (req, res) => {
  const sql = `SELECT * FROM sports`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("sports", {
      data: result,
    });
  });
});

// Get all the events that the athlete had participated in
// Reference for using Case with Order By: https://stackoverflow.com/questions/19486882/case-when-statement-for-order-by-clause
app.get("/athlete", (req, res) => {
  let id = req.query.athlete_id;
  // Order by age so that the earlier games appear first, then depending on the medal
  const sql = `SELECT DISTINCT a.name, ag.age, ag.height, ag.weight, n.team, g.season, g.city, g.year, aem.medal, e.event_name
      FROM athlete_game ag
      INNER JOIN noc n ON n.noc_id = ag.noc_id
      INNER JOIN athletes a ON ag.athlete_id = a.athlete_id
      INNER JOIN games g ON ag.game_id = g.game_id
      INNER JOIN athlete_event_medal aem ON a.athlete_id = aem.athlete_id
      INNER JOIN events e ON aem.event_id = e.event_id
      WHERE ag.athlete_id = ?
      ORDER BY
      age,
          CASE
          WHEN medal = 'Gold' THEN 1
          WHEN medal = 'Silver' THEN 2
          ELSE 3
      END,
      medal
      `;
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.render("athlete", {
      data: result,
    });
  });
});

// Question One: How many sports were there at each game?
app.get("/games_no", (req, res) => {
  const sql = `SELECT g.season, g.city, g.year, count(sport_id) AS sport_count
    FROM games g
    INNER JOIN events e
    ON g.game_id = e.game_id
    GROUP BY g.game_id
    ORDER BY g.year`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("games_no", {
      data: result,
    });
  });
});

// Question Two: What is the average age of athletes that won medals?
app.get("/avg_age_olympians", (req, res) => {
  const sql = `SELECT AVG(ag.age) AS age
        FROM athlete_game ag
        INNER JOIN athlete_event_medal aem
        ON ag.athlete_id = aem.athlete_id
        WHERE aem.medal != 'No medal'`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("avg_age_olympians", {
      data: result,
    });
  });
});

// Question Three: Who is the oldest olympian and what did they participate in?
app.get("/oldest_olympian", (req, res) => {
  const sql = `SELECT a.athlete_id, a.name, a.sex, ag.age, ag.height, e.event_name
    FROM athletes a
    INNER JOIN athlete_game ag
    ON a.athlete_id = ag.athlete_id
    LEFT JOIN athlete_event_medal aem
    ON a.athlete_id = aem.athlete_id
    LEFT JOIN events e
    ON aem.event_id = e.event_id
    WHERE age = (SELECT MAX(age) from athlete_game)`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("oldest_olympian", {
      data: result[0],
    });
  });
});

// Question Four: Which NOC won the most number of Gold, Silver and Bronze medals?
// Reference for SUM and CASE: https://learnsql.com/blog/case-when-with-sum/
app.get("/noc_games", (req, res) => {
  const sql = `SELECT n.noc, g.city, g.year, g.season,
         SUM(CASE WHEN aem.medal = 'Gold' THEN 1 ELSE 0 END) AS gold,
         SUM(CASE WHEN aem.medal = 'Silver' THEN 1 ELSE 0 END) AS silver,
         SUM(CASE WHEN aem.medal = 'Bronze' THEN 1 ELSE 0 END) AS bronze,
         COUNT(aem.medal) AS total
         FROM noc n
         JOIN athlete_game ag ON n.noc_id = ag.noc_id
         JOIN games g ON ag.game_id = g.game_id
         LEFT JOIN athlete_event_medal aem ON ag.athlete_id = aem.athlete_id
         GROUP BY n.noc, g.game_id, g.year, g.season
         ORDER BY total DESC`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("noc_games", {
      data: result,
    });
  });
});

// Question Five: From all four games, which 10 female athletes accoumulated the most gold medals?
app.get("/female_most_medals", (req, res) => {
  db.query(
    `SELECT a.athlete_id, a.name, count(m.athlete_id) AS gold_medal_count
    FROM athlete_event_medal m
    INNER JOIN athletes a
    ON a.athlete_id = m.athlete_id
    WHERE m.medal = 'Gold' AND a.sex = 'F'
    GROUP BY a.athlete_id
    ORDER BY gold_medal_count DESC
    LIMIT 10;`,
    function (err, result) {
      if (err) throw err;
      res.render("female_most_medals", {
        data: result,
      });
    }
  );
});

// Question Six: How old is the youngest Olympian and what country do they represent?
// Reference for subquery: https://www.w3resource.com/sql/subqueries/understanding-sql-subqueries.php
app.get("/youngest_olympian", (req, res) => {
  const sql = `SELECT a.athlete_id, a.name, a.sex, ag.age, ag.height, n.team
    FROM athletes a
    INNER JOIN athlete_game ag
    ON a.athlete_id = ag.athlete_id
    LEFT JOIN noc n
    ON ag.noc_id = n.noc_id
    WHERE age = (SELECT MIN(age) from athlete_game)`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("youngest_olympian", {
      data: result,
    });
  });
});

// Question Seven: What is the average height and weight of athletes in a sport?
app.get("/sports-average-olympian", (req, res) => {
  let id = req.query.sport_id;
  console.log(id);
  // Use INNER JOIN to find athletes who participated in the specified sport
  const sql = `SELECT s.name, AVG(ag.height), AVG(ag.weight), AVG(ag.age)
    FROM athlete_game ag
    INNER JOIN events e ON ag.game_id = e.game_id
    INNER JOIN sports s ON e.sport_id = s.sport_id
    WHERE s.sport_id = ?
    `;
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.render("avg_olympian", {
      data: result[0],
    });
  });
});

// Question Eight: Are there any athletes that took part in both the Summer and Winter games, and won medals?
// Reference for With Clause: https://www.geeksforgeeks.org/sql-with-clause/
app.get("/summer_winter", (req, res) => {
  const sql = `WITH pro_athletes AS (SELECT a.athlete_id, a.name, a.sex
    FROM athletes a
    JOIN athlete_game ag ON a.athlete_id = ag.athlete_id
    JOIN games g ON ag.game_id = g.game_id
    WHERE g.season IN ('Summer', 'Winter')
    GROUP BY a.athlete_id, a.name, a.sex
    HAVING COUNT(DISTINCT g.season) = 2)

    SELECT p.name, p.sex, e.event_name, g.season, g.city, g.year, aem.medal, p.athlete_id
    FROM athlete_event_medal aem
    INNER JOIN pro_athletes p
    ON aem.athlete_id = p.athlete_id
    LEFT JOIN events e
    ON aem.event_id = e.event_id
    LEFT JOIN games g
    ON e.game_id = g.game_id
    WHERE aem.medal != 'No medal'`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("summer_winter", {
      data: result,
    });
  });
});

// Question Nine: Are there athletes that won Bronze in London 2012 and won a Gold medal at Rio 2016?
// Reference for existance of rows: https://dba.stackexchange.com/questions/159413/exists-select-1-vs-exists-select-one-or-the-other
// Reference for EXISTS clause: https://www.w3schools.com/sql/sql_exists.asp

app.get("/goldies", (req, res) => {
  const sql = `WITH london_athletes AS (
  SELECT DISTINCT a.name, ag.athlete_id, ag.game_id
  FROM athlete_game ag
  INNER JOIN athletes a ON ag.athlete_id = a.athlete_id
  INNER JOIN athlete_event_medal aem ON ag.athlete_id = aem.athlete_id
  WHERE ag.game_id = (
    SELECT game_id
    FROM games
    WHERE year = 2012 AND city = 'London'
  )
  AND aem.medal = 'Gold'
)

SELECT la.athlete_id, la.name
FROM london_athletes la
WHERE NOT EXISTS (
  SELECT 1
  FROM athlete_game ag2
  INNER JOIN athlete_event_medal aem2
  ON ag2.athlete_id = aem2.athlete_id
  WHERE ag2.athlete_id = la.athlete_id AND ag2.game_id = la.game_id
  AND aem2.medal IN ('No medal')
)
AND EXISTS (
  SELECT 1
  FROM athlete_game ag3
  INNER JOIN athlete_event_medal aem3
  ON ag3.athlete_id = aem3.athlete_id
  WHERE ag3.athlete_id = la.athlete_id
  AND aem3.medal IN ('Gold')
  AND ag3.game_id = (
    SELECT game_id
    FROM games
    WHERE year = 2016 AND city = 'Rio de Janeiro'
  )
)`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("goldies", {
      data: result,
    });
  });
});

// Question Ten: Was there any NOCs that participated in the 2010 Vancouver games but not the 2014 Sochi games?
// Reference for using Except clause: https://www.tutorialspoint.com/sql/sql-except-clause.html
// However, Coursera labs did not support Except clause, hence changed it to NOT IN.
app.get("/vancouver_sochi", (req, res) => {
  const sql = `SELECT n1.noc_id, n1.noc, n1.team
FROM noc n1
LEFT JOIN athlete_game ag1
  ON n1.noc_id = ag1.noc_id
WHERE ag1.game_id = (SELECT game_id FROM games WHERE year = '2010')
  AND n1.noc_id NOT IN (
    SELECT n2.noc_id
    FROM noc n2
    LEFT JOIN athlete_game ag2
      ON n2.noc_id = ag2.noc_id
    WHERE ag2.game_id = (SELECT game_id FROM games WHERE year = '2014')
  );
`;
  db.query(sql, function (err, result) {
    if (err) throw err;
    res.render("vancouver_sochi", {
      data: result,
    });
  });
});

// App ready to listen
app.listen(port, function () {
  console.log("The app is listening at http://localhost:" + port + ".");
});
