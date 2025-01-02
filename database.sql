CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL, password VARCHAR(255) NOT NULL, salt VARCHAR(255));

CREATE TABLE data (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    transportmode VARCHAR(45),
    distance REAL,
    electricity REAL,
    waste REAL,
    gas REAL,
    userid INT NOT NULL,
    carbonFootprint REAL,
    date DATE,
    FOREIGN KEY (userid) REFERENCES users (id)  -- Assuming you have a 'users' table with an 'id' column
);
