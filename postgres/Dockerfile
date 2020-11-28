FROM postgres

ENV POSTGRES_USER test_user
ENV POSTGRES_PASSWORD test_password
ENV POSTGRES_DB test_db

COPY initdb.sql /docker-entrypoint-initdb.d/
