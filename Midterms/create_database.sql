# To check whether the file is created or not, click on the left part and go > project > data > pollution.csv

# This .sql file does a few things - create database, user and grants user

/* create a project database, and drop it first if it already exists */
DROP DATABASE IF EXISTS olympics;
CREATE DATABASE olympics;

/* create a database user, called francis, and drop it first if it already exists */
DROP USER IF EXISTS 'coder'@'%';
CREATE USER 'coder'@'%' IDENTIFIED WITH mysql_native_password BY 'olympics';

/* grant user access to the project data, which was created earlier */
GRANT ALL ON olympics.* TO 'coder'@'%';

/* only for running in colab, grant user francis to server related configuration */
GRANT SELECT ON mysql.* TO 'coder'@'%';
