# postgres://user:pass@localhost:5432/userdb

create table if not exists users( id varchar(50) not null primary key, email varchar(50) not null, password varchar(50) not null, name varchar(50) default '' );"
