# psql "postgres://user:pass@localhost:5432/userdb"

delete table users;

create table if not exists users( id varchar(50) not null primary key, email varchar(50) not null, password varchar(50) not null, name varchar(50) default '' );"

# password = password
insert into users( id, email, password, name ) values( '001', 'dotnsf@gmail.com', '5f4dcc3b5aa765d61d8327deb882cf99', 'K.Kimura' );
insert into users( id, email, password, name ) values( '002', 'kkimura@juge.me', '5f4dcc3b5aa765d61d8327deb882cf99', 'きむらけい' );