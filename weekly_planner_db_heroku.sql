-- Restore to initial state

DROP SCHEMA public CASCADE;

CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO postgres;

GRANT ALL ON SCHEMA public TO public;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP USER IF EXISTS test_user;


-- Create tables

CREATE TABLE planner
(
   planner_id          SERIAL         PRIMARY KEY
,  first_name          VARCHAR(100)   
,  middle_initial      CHAR(1)
,  last_name           VARCHAR(100)   
,  email               VARCHAR(200)                 UNIQUE
,  username            VARCHAR(100)   NOT NULL      UNIQUE
,  password            VARCHAR(100)   NOT NULL
,  planner_image_url   TEXT                      
);

CREATE TABLE task
(
   task_id           SERIAL    PRIMARY KEY
,  class             CHAR(8)   NOT NULL
,  description       TEXT      NOT NULL
,  due_time          TIME      NOT NULL
,  total_work_time   NUMERIC   NOT NULL
);

CREATE TABLE day
(
   day_id                     SERIAL    PRIMARY KEY
,  name                       CHAR(9)   NOT NULL
,  total_work_time_day        NUMERIC   NOT NULL      DEFAULT 0
,  total_available_time_day   NUMERIC   NOT NULL      DEFAULT 0
,  planner_id                 INT       REFERENCES    planner(planner_id)
);

CREATE TABLE task_day
(
   task_day_id   SERIAL   PRIMARY KEY
,  task_id       INT      REFERENCES task(task_id)
,  day_id        INT      REFERENCES day(day_id)
,  planner_id    INT      REFERENCES planner(planner_id)
);

CREATE TABLE week
(
   week_id                     SERIAL    PRIMARY KEY
,  total_work_time_week        NUMERIC   NOT NULL      DEFAULT 0
,  total_available_time_week   NUMERIC   NOT NULL      DEFAULT 0
);

-- Add initial values

-- Create test user

-- CREATE USER test_user WITH PASSWORD 'password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON planner, day, task, task_day, week TO test_user;
-- GRANT USAGE, SELECT ON SEQUENCE planner_planner_id_seq, day_day_id_seq, task_task_id_seq, task_day_task_day_id_seq, week_week_id_seq TO test_user;
-- INSERT INTO planner
-- (
--    username
-- ,  password
-- )
-- VALUES
-- (
--    'test_user'
-- ,  'password'
-- );

-- INSERT INTO day (name, planner_id) VALUES ('Monday', 1);
-- INSERT INTO day (name, planner_id) VALUES ('Tuesday', 1);
-- INSERT INTO day (name, planner_id) VALUES ('Wednesday', 1);
-- INSERT INTO day (name, planner_id) VALUES ('Thursday', 1);
-- INSERT INTO day (name, planner_id) VALUES ('Friday', 1);
-- INSERT INTO day (name, planner_id) VALUES ('Saturday', 1);
-- INSERT INTO day (name, planner_id) VALUES ('Sunday', 1);

-- -- Add initial values

-- -- Create test user

-- CREATE USER test_user2 WITH PASSWORD 'password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON planner, day, task, task_day, week TO test_user2;
-- GRANT USAGE, SELECT ON SEQUENCE planner_planner_id_seq, day_day_id_seq, task_task_id_seq, task_day_task_day_id_seq, week_week_id_seq TO test_user2;
-- INSERT INTO planner
-- (
--    username
-- ,  password
-- )
-- VALUES
-- (
--    'test_user2'
-- ,  'password'
-- );

-- INSERT INTO day (name, planner_id) VALUES ('Monday', 2);
-- INSERT INTO day (name, planner_id) VALUES ('Tuesday', 2);
-- INSERT INTO day (name, planner_id) VALUES ('Wednesday', 2);
-- INSERT INTO day (name, planner_id) VALUES ('Thursday', 2);
-- INSERT INTO day (name, planner_id) VALUES ('Friday', 2);
-- INSERT INTO day (name, planner_id) VALUES ('Saturday', 2);
-- INSERT INTO day (name, planner_id) VALUES ('Sunday', 2);