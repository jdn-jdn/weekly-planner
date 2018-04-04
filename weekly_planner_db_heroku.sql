-- Restore to initial state

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';

-- Create tables

CREATE TABLE planner
(
   planner_id          SERIAL         PRIMARY KEY
,  username            VARCHAR(100)   NOT NULL      UNIQUE
,  password            VARCHAR(100)   NOT NULL
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