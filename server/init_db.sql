begin;
create table profiles (
  id integer primary key,
  name text not null unique,
  session_id text unique
);

create table chat_threads (
  id integer primary key,
  name text,
  profile_id integer not null,
  foreign key (profile_id) 
    references profiles (id) 
           on delete cascade 
           on update no action
);

create table chat_roles(
  id integer primary key,
  name text not null unique
);

create table chat_messages (
  id integer primary key,
  thread_id integer not null,
  role_id integer not null,
  content text not null,
  timestamp datetime default current_timestamp,
  foreign key (thread_id) 
    references chat_threads (id) 
           on delete cascade 
           on update no action,
  foreign key (role_id) 
    references chat_roles (id) 
           on delete cascade 
           on update no action

);
commit;
