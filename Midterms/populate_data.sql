USE olympics;

DELETE FROM athlete_event_medal;
DELETE FROM athlete_game;
DELETE FROM events;
DELETE FROM sports;
DELETE FROM games;
DELETE FROM athletes;
DELETE FROM noc;

INSERT INTO noc (noc, team)
  SELECT DISTINCT noc, team FROM denormalised;

INSERT INTO athletes (athlete_id, name, sex)
  SELECT DISTINCT id, name, sex FROM denormalised;

INSERT INTO games (season, city, year)
  SELECT DISTINCT season, city, year FROM denormalised;

INSERT INTO sports (name)
  SELECT DISTINCT sport FROM denormalised;

INSERT INTO events (event_name, sport_id, game_id)
  SELECT DISTINCT d.event, s.sport_id, g.game_id
  FROM denormalised d
  INNER JOIN sports s
  ON d.sport = s.name
  INNER JOIN games g
  ON d.year = g.year AND d.season = g.season AND d.city = g.city;

INSERT INTO athlete_game (athlete_id, game_id, age, height, weight, noc_id)
  SELECT DISTINCT a.athlete_id, g.game_id, d.age, d.height, d.weight, n.noc_id
  FROM denormalised d
  INNER JOIN athletes a
  ON d.id = a.athlete_id
  INNER JOIN games g
  ON d.year = g.year AND d.season = g.season AND d.city = g.city
  INNER JOIN noc n
  ON d.noc = n.noc AND d.team = n.team;

INSERT INTO athlete_event_medal (athlete_id, event_id, medal)
  SELECT DISTINCT a.athlete_id, e.event_id, d.medal
  FROM denormalised d
  INNER JOIN athletes a
  ON d.id = a.athlete_id
  INNER JOIN events e
  ON e.sport_id = (SELECT sport_id FROM sports s WHERE s.name = d.sport)
  AND e.game_id = (SELECT game_id FROM games g WHERE g.year = d.year AND g.season = d.season AND g.city = d.city)
  AND e.event_name = d.event;
