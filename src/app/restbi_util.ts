import { Connection, Table, SQLError } from "restbi-sdk";

export async function getMetadata(connection: Connection): Promise<Table[]> {
    const response = await fetch('http://localhost:3000/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connection),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const result = await response.json() as Table[] | SQLError;
    if ('message' in result) {
      throw new Error((result as SQLError).message);
    }
    return result as Table[];
  }

