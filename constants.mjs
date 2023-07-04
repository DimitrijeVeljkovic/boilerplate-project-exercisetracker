export const CREATE_TABLE_USER = `
    CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY ASC,
        username VARCHAR(255)
    )
`;

export const CREATE_TABLE_EXERCISE = `
    CREATE TABLE  IF NOT EXISTS Excercise (
        id INTEGER PRIMARY KEY ASC,
        description VARCHAR(255),
        duration INTEGER,
        date DATE,
        userId INTEGER,

        FOREIGN KEY (userId) REFERENCES User(id)
    )
`;
