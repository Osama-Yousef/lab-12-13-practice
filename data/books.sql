DROP TABLE IF EXISTS books ;
CREATE TABLE books(
    id SERIAL PRIMARY KEY ,
    author VARCHAR(255),
    title VARCHAR(255),
    isbn VARCHAR(255),
    image_url VARCHAR(255),
    description  TEXT,
    bookshelf VARCHAR(255)
);

/*PORT=5050
DATABASE_URL=postgres://osama:1234@localhost:5432/books_app
*/