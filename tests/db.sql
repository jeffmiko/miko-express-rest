
CREATE DATABASE IF NOT EXISTS mikoresttest DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mikoresttest;

CREATE USER 'mikoresttest'@'%' IDENTIFIED BY 'resttest76abc';
ALTER USER 'mikoresttest'@'%' IDENTIFIED WITH mysql_native_password BY 'resttest76abc';

GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,CREATE TEMPORARY TABLES,DROP,INDEX,ALTER 
  ON mikoresttest.* TO 'mikoresttest'@'%' ;


CREATE TABLE users (
  userpk int NOT NULL AUTO_INCREMENT,
  email varchar(255) NOT NULL,
  givenname varchar(40) DEFAULT NULL,
  familyname varchar(40) DEFAULT NULL,
  image varchar(512) DEFAULT NULL,
  created datetime NOT NULL DEFAULT current_timestamp(),
  updated datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (userpk),
  UNIQUE KEY ix_users_platform_id (email)
) ENGINE=InnoDB ;

