begin;
create table users (
  id integer primary key,
  name text not null unique
);

create table chat_sessions (
  id integer primary key,
  user_id integer not null,
  ai_profile text not null,
  name text not null,
  foreign key (user_id) 
    references users (id) 
           on delete cascade 
           on update no action
);

create table chat_roles(
  id integer primary key,
  name text not null unique
);

create table chat_messages (
  id integer primary key,
  session_id integer not null,
  role_id integer not null,
  content text not null,
  timestamp datetime default current_timestamp,
  foreign key (session_id) 
    references chat_sessions (id) 
           on delete cascade 
           on update no action,
  foreign key (role_id) 
    references chat_roles (id) 
           on delete cascade 
           on update no action

);
commit;
