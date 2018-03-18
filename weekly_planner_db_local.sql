-- Reset database and connect

DROP DATABASE weekly_planner;

CREATE DATABASE weekly_planner;

DROP USER IF EXISTS test_user;

\c weekly_planner

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
);

CREATE TABLE task_day
(
   task_day_id   SERIAL   PRIMARY KEY
,  task_id       INT      REFERENCES task(task_id)
,  day_id        INT      REFERENCES day(day_id)
);

CREATE TABLE week
(
   week_id                     SERIAL    PRIMARY KEY
,  total_work_time_week        NUMERIC   NOT NULL      DEFAULT 0
,  total_available_time_week   NUMERIC   NOT NULL      DEFAULT 0
);

-- Add initial values

INSERT INTO day (name) VALUES ('Monday');

INSERT INTO day (name) VALUES ('Tuesday');

INSERT INTO day (name) VALUES ('Wednesday');

INSERT INTO day (name) VALUES ('Thursday');

INSERT INTO day (name) VALUES ('Friday');

INSERT INTO day (name) VALUES ('Saturday');

INSERT INTO day (name) VALUES ('Sunday');

-- Create test user

CREATE USER test_user WITH PASSWORD 'password';

GRANT SELECT, INSERT, UPDATE, DELETE ON planner, day, task, task_day, week TO test_user;

GRANT USAGE, SELECT ON SEQUENCE planner_planner_id_seq, day_day_id_seq, task_task_id_seq, task_day_task_day_id_seq, week_week_id_seq TO test_user;