
USE olympics;

DROP TABLE IF EXISTS denormalised;
CREATE TABLE denormalised (
    id INT,
    name VARCHAR(128),
    sex VARCHAR(64),
    age INT,
    height INT NULL,
    weight INT NULL,
    team VARCHAR(64),
    noc VARCHAR(64),
    games VARCHAR(128),
    year INT,
    season VARCHAR(128),
    city VARCHAR(64),
    sport VARCHAR(64),
    event VARCHAR(128),
    medal VARCHAR(64)
);

LOAD DATA INFILE '/home/coder/project/olympics/data/athletes_events_cleaned.csv'
INTO TABLE denormalised
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, name, sex, @age, @height, @weight, team, noc, games, @year, season, city, sport, event, medal)
SET age = NULLIF(@age,''),
    height = CASE
                WHEN @height = '' OR @height = 'N' THEN NULL
                ELSE @height
             END,
    weight = NULLIF(@weight, ''),
    year = NULLIF(@year, '');


