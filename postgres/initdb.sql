CREATE TABLE films (
    id          serial PRIMARY KEY,
    title       varchar(40) NOT NULL,
    date_prod   timestamp with time zone,
    len         integer NOT NULL,
    meta        jsonb
);

CREATE TABLE distributors (
     did    serial PRIMARY KEY,
     name   varchar(40) NOT NULL CHECK (name <> '')
);
