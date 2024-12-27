USE olympics;

DROP TABLE IF EXISTS athlete_event_medal;
DROP TABLE IF EXISTS athlete_game;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS sports;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS athletes;
DROP TABLE IF EXISTS noc;


CREATE TABLE noc (
  noc_id int PRIMARY KEY AUTO_INCREMENT,
  noc varchar(255),
  team varchar(255)
);

CREATE TABLE athletes (
  athlete_id int PRIMARY KEY,
  name varchar(255),
  sex varchar(255)
);


CREATE TABLE games (
  game_id int PRIMARY KEY AUTO_INCREMENT,
  season varchar(255),
  city varchar(255),
  year int
);

CREATE TABLE sports (
  sport_id int PRIMARY KEY AUTO_INCREMENT,
  name varchar(255)
);

CREATE TABLE events (
  event_id int PRIMARY KEY AUTO_INCREMENT,
  event_name varchar(255),
  sport_id int,
  game_id int,
  FOREIGN KEY (sport_id) REFERENCES sports(sport_id),
  FOREIGN KEY (game_id) REFERENCES games(game_id)
);

CREATE TABLE athlete_game (
  athlete_id int,
  game_id int,
  age int,
  height int,
  weight int,
  noc_id int,
  PRIMARY KEY (athlete_id, game_id, noc_id),
  FOREIGN KEY (noc_id) REFERENCES noc(noc_id),
  FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id),
  FOREIGN KEY (game_id) REFERENCES games(game_id)
);

CREATE TABLE athlete_event_medal (
  athlete_id int,
  event_id int,
  medal varchar(255),
  PRIMARY KEY (athlete_id, event_id),
  FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

# ALTER TABLE `events` ADD FOREIGN KEY (`sport_id`) REFERENCES `sports` (`sport_id`);

# ALTER TABLE `athlete_game` ADD FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`athelete_id`);

# ALTER TABLE `athlete_game` ADD FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`);

# ALTER TABLE `athlete_event_medal` ADD FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`athelete_id`);

# ALTER TABLE `athlete_event_medal` ADD FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`);
