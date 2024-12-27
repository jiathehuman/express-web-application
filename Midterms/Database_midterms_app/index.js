const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const env = require('dotenv').config();

const app = express();
const port = 3000;

// app.engine('html', 'ejs');
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

global.db = mysql.createConnection({
    host: env.parsed.HOST,
    user: env.parsed.USER_NAME,
    password: env.parsed.PASSWORD,
    database: env.parsed.DATABASE
})
app.get('/', (req, res) => {
    res.render("index")
});
// Are there any athletes that took part in both the Summer and Winter games, and won medals?
app.get('/games_no', (req, res) => {
    db.query(`SELECT g.season, g.city, g.year, count(sport_id) AS sport_count
    FROM games g
    INNER JOIN events e
    ON g.game_id = e.game_id
    GROUP BY g.game_id
    ORDER BY g.year`, function(err, result){
            if(err) throw err;
        console.log(result)
        res.render("games_no",{
        data: result
    })
})
});

// What is the average age of athletes that won medals?
app.get('/avg_age_olympians', (req, res) => {
    db.query(`SELECT AVG(ag.age) AS age
        FROM athlete_game ag
        INNER JOIN athlete_event_medal aem
        ON ag.athlete_id = aem.athlete_id
        WHERE aem.medal != 'No medal'`, function(err, result){
        if(err) throw err;
        console.log(result)
        res.render("avg_age_olympians",{
        data: result
    })
})
});

// Who is the oldest olympian?
app.get('/oldest_olympian', (req, res) => {
    db.query(`SELECT a.athlete_id, a.name, a.sex, ag.age, ag.height, e.event_name
    FROM athletes a
    INNER JOIN athlete_game ag
    ON a.athlete_id = ag.athlete_id
    LEFT JOIN athlete_event_medal aem
    ON a.athlete_id = aem.athlete_id
    LEFT JOIN events e
    ON aem.event_id = e.event_id
    WHERE age = (SELECT MAX(age) from athlete_game)`, function(err, result){
        if(err) throw err;
        console.log(result)
        res.render("oldest_olympian",{
        data: result[0]
    })
})
});

// From all four games, which 10 female athletes accoumulated the most gold medals?
app.get('/female_most_medals', (req, res) => {
    db.query(`SELECT a.athlete_id, a.name, count(m.athlete_id) AS gold_medal_count
    FROM athlete_event_medal m
    INNER JOIN athletes a
    ON a.athlete_id = m.athlete_id
    WHERE medal = 'Gold' AND a.sex = 'F'
    GROUP BY a.athlete_id
    ORDER BY gold_medal_count DESC
    LIMIT 10;`, function(err, result){
            if(err) throw err;
            console.log(result)
            res.render("female_most_medals",{
            data: result
    })
})
});

// Who is the youngest olympian?
app.get('/youngest_olympian', (req, res) => {
    db.query(`SELECT a.athlete_id, a.name, a.sex, ag.age, ag.height, n.team
    FROM athletes a
    INNER JOIN athlete_game ag
    ON a.athlete_id = ag.athlete_id
    LEFT JOIN noc n
    ON ag.noc_id = n.noc_id
    WHERE age = (SELECT MIN(age) from athlete_game)`, function(err, result){
        if(err) throw err;
        console.log(result)
        res.render("youngest_olympian",{
        data: result
    })
})
});

// Get all sports
app.get('/sports', (req, res) => {
    db.query(`SELECT * FROM sports LIMIT 25`, function(err, result){
        if(err) throw err;
        console.log(result)
        res.render("sports",{
        data: result
    })
})
});

app.get('/sports-average-olympian', (req, res) => {
    let id = req.query.sport_id;

    console.log(id)

    // Use INNER JOIN to find athletes who participated in the specified sport
    const sql = `
    SELECT s.name, AVG(ag.height), AVG(ag.weight), AVG(ag.age)
    FROM athlete_game ag
    INNER JOIN events e ON ag.game_id = e.game_id
    INNER JOIN sports s ON e.sport_id = s.sport_id
    WHERE s.sport_id = ?
    `
    db.query(sql,
      [id],
      (err, result) => {
        if (err) {
        // send the error
          console.error(err);
          return res.status(500).send("Error retrieving athlete data");
        }

        console.log(result);
        res.render("avg_olympian", {
          data: result[0]
        });
      }
    );
});

// Are there any athletes that took part in both the Summer and Winter games, and won medals?
app.get('/summer_winter', (req, res) => {
    db.query(`WITH pro_athletes AS (SELECT a.athlete_id, a.name, a.sex
    FROM athletes a
    JOIN athlete_game ag ON a.athlete_id = ag.athlete_id
    JOIN games g ON ag.game_id = g.game_id
    WHERE g.season IN ('Summer', 'Winter')
    GROUP BY a.athlete_id, a.name, a.sex
    HAVING COUNT(DISTINCT g.season) = 2)

    SELECT p.name, p.sex, e.event_name, g.season, g.city, g.year, aem.medal
    FROM athlete_event_medal aem
    RIGHT JOIN pro_athletes p
    ON aem.athlete_id = p.athlete_id
    RIGHT JOIN events e
    ON aem.event_id = e.event_id
    RIGHT JOIN games g
    ON e.game_id = g.game_id
    WHERE aem.medal != 'No medal'`, function(err, result){
        if(err) throw err;
        console.log(result)
        res.render("summer_winter",{
        data: result
    })
})
});

// Was there any NOCs that participated in the 2012 London games but not the 2016 Rio games?
app.get('/bronze_gold', (req, res) => {
    db.query(`SELECT DISTINCT ag1.athlete_id, a.name
    FROM athlete_game ag1
    JOIN athletes a ON ag1.athlete_id = a.athlete_id
    JOIN games g1 ON ag1.game_id = g1.game_id
    LEFT JOIN athlete_event_medal aem1 ON ag1.athlete_id = aem1.athlete_id
    WHERE g1.city = 'London' AND g1.year = 2012 AND aem1.medal = "Bronze"
    AND EXISTS (
        SELECT 1
        FROM athlete_game ag2
        JOIN games g2 ON ag2.game_id = g2.game_id
        JOIN athlete_event_medal aem2 ON ag2.athlete_id = aem2.athlete_id
        WHERE ag1.athlete_id = ag2.athlete_id AND aem2.medal = "Gold"
        AND g2.city = 'Rio de Janeiro' AND g2.year = 2016
)`, function(err, result){
        if(err) throw err;
        console.log(result)
        res.render("bronze_gold",{
        data: result
    })
})
});

app.get('/athlete', (req, res) => {
    let id = req.query.athlete_id;

    console.log(id)

    // Use INNER JOIN to find athletes who participated in the specified sport
    const sql = `
    SELECT a.name, ag.height, ag.weight, n.team, g.season, g.city, g.year
    FROM athlete_game ag
    INNER JOIN noc n
    ON n.noc_id = ag.noc_id
    INNER JOIN athletes a
    ON ag.athlete_id = a.athlete_id
    INNER JOIN games g
    ON ag.game_id = g.game_id
    WHERE ag.athlete_id = ?
    `
    db.query(sql,
      [id],
      (err, result) => {
        if (err) {
        // send the error
          console.error(err);
          return res.status(500).send("Error retrieving athlete data");
        }
        console.log(result);
        res.render("athlete", {
          data: result
        });

      }
    );
});



app.get('/country_medals_winter', (req, res) => {
    db.query(`SELECT
    n.noc AS country,
    COUNT(*) AS total_medals
    FROM
        noc n
    LEFT JOIN
        athlete_game ag ON n.noc_id = ag.noc_id
    LEFT JOIN
        athlete_event_medal aem ON ag.athlete_id = aem.athlete_id
    LEFT JOIN
        games g ON ag.game_id = g.game_id
    WHERE
        g.season = 'Winter'
    GROUP BY
        n.noc_id
    ORDER BY
        total_medals DESC
    LIMIT 10`, function(err, result){
                if(err) throw err;
            console.log(result)
            res.render("country_medals_winter",{
            data: result
    })
})
});

app.get('/vancouver_sochi', (req, res) => {
    db.query(`(SELECT n.noc_id, n.noc, n.team
    FROM noc n
    LEFT JOIN athlete_game ag
    ON n.noc_id = ag.noc_id
    WHERE ag.game_id = (SELECT game_id FROM games WHERE year = '2014'))
    EXCEPT
    (SELECT n.noc_id, n.noc, n.team
    FROM noc n
    LEFT JOIN athlete_game ag
    ON n.noc_id = ag.noc_id
    WHERE ag.game_id = (SELECT game_id FROM games WHERE year = '2010'))`, function(err, result){
                if(err) throw err;
            console.log(result)
            res.render("vancouver_sochi",{
            data: result
    })
})
});


app.listen(port, function () {
    console.log('The app is listening at http://localhost:' + port + '.');
})