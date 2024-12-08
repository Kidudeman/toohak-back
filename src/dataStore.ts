import fs from 'fs';
import { User, Quiz, ActiveUser, Player, QuizSession } from './types';

export interface Data {
  users: User[];
  quizzes: Quiz[];
  activeUsers: ActiveUser[];
  activePlayers: Player[];
  quizSessions: QuizSession[];
  trash: Quiz[];
}

let data: Data = {
  users: [],
  quizzes: [],
  activeUsers: [],
  activePlayers: [],
  quizSessions: [],
  trash: [],
};

// Use data = get() to access the data object
function getData(): Data {
  return data;
}

// Use set(data) to pass in the entire data object
function setData(newData: Data) {
  data = newData;
}

export function loadDataStore() {
  fs.readFile('./dataStore.json', (err, data) => {
    if (err) {
      return;
    }
    try {
      setData(JSON.parse(data.toString()));
    } catch (e) {
      console.error(e);
    }
  });
}

export function saveDataStore(): void {
  fs.writeFile('./dataStore.json', JSON.stringify(getData()), (err) => {
    if (err) {
      console.error(err);
    }
  });
}

export { getData, setData };
