CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  -- Body
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  height_cm REAL NOT NULL,
  has_heart_disease INTEGER NOT NULL DEFAULT 0,
  has_diabetes INTEGER NOT NULL DEFAULT 0,
  has_hypertension INTEGER NOT NULL DEFAULT 0,
  has_cancer INTEGER NOT NULL DEFAULT 0,
  has_respiratory_disease INTEGER NOT NULL DEFAULT 0,
  -- Habits
  transport_mode TEXT NOT NULL,
  km_per_day REAL NOT NULL DEFAULT 0,
  diet TEXT NOT NULL,
  drinks_per_week REAL NOT NULL DEFAULT 0,
  smoking_status TEXT NOT NULL,
  cigarettes_per_day REAL NOT NULL DEFAULT 0,
  exercise_hours_per_week REAL NOT NULL DEFAULT 0,
  -- Activities
  does_skydiving INTEGER NOT NULL DEFAULT 0,
  does_scuba INTEGER NOT NULL DEFAULT 0,
  does_motorcycling INTEGER NOT NULL DEFAULT 0,
  does_skiing INTEGER NOT NULL DEFAULT 0,
  does_rock_climbing INTEGER NOT NULL DEFAULT 0,
  -- Location
  country TEXT NOT NULL,
  -- Results
  total_micromorts REAL NOT NULL,
  body_micromorts REAL NOT NULL,
  habits_micromorts REAL NOT NULL,
  location_micromorts REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_country ON submissions(country);
CREATE INDEX idx_submissions_age ON submissions(age);
CREATE INDEX idx_submissions_total ON submissions(total_micromorts);
