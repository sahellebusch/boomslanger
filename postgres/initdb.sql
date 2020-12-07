CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE films (
    uuid        uuid DEFAULT uuid_generate_v4 (),
    id          serial PRIMARY KEY,
    title       varchar(40) NOT NULL,
    date_prod   timestamp with time zone,
    len         integer NOT NULL,
    meta        jsonb
);
