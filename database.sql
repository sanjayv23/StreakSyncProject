CREATE TABLE complete_percentage (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  percentage INTEGER,
  UNIQUE (user_id, date)
);


CREATE TABLE streak_calen (
  date DATE,
  complete_percent INTEGER,
  user_id UUID
  
);

CREATE TABLE complete_task (
  date  DATE,
  task VARCHAR(255),
  task_id varchar(36),
  user_id varchar(36)

);

CREATE TABLE task (
  date  DATE,
  task VARCHAR(255),
  task_id varchar(36),
  user_id varchar(36)

);

CREATE TABLE users (
  id uuid,
  name text,
  mail text,
  password text
);


INSERT INTO complete_percentage (id, user_id, date, percentage)
SELECT 
    row_number() OVER () + COALESCE((SELECT MAX(id) FROM complete_percentage), 0) AS id,
    'c6c6023b-4163-4603-81af-cd48149dda76' AS user_id,
    gs::date AS date,
    FLOOR(random() * 101)::int AS percentage
FROM generate_series('2025-03-01'::date, '2025-12-31'::date, '1 day') AS gs
ON CONFLICT (user_id, date) 
DO UPDATE SET percentage = EXCLUDED.percentage;
