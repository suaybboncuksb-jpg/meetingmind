CREATE USER meetingmind_user WITH PASSWORD 'meetingmind_password';
CREATE DATABASE meetingmind WITH OWNER meetingmind_user;
GRANT ALL PRIVILEGES ON DATABASE meetingmind TO meetingmind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO meetingmind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO meetingmind_user;
