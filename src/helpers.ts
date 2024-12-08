import { v4 as uuidv4 } from 'uuid';
import { parse } from 'uuid';
import { Question, Quiz, User, UserID, Player, PlayerID, QuizSession, QuestionResult, AnswerID, SessionID } from './types';
import { Token } from './types';
import { getData } from './dataStore';
import crypto from 'crypto';

// Hashing helper function for passwords
export function getHashOf(plaintext: string) {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

// generates unique token for given user session
export function generateToken(userId: UserID): Token {
  let sessionId: SessionID;

  do {
    sessionId = generateUniqueNumberId();
  } while (getData().activeUsers.find(activeUser => activeUser.token.sessionId === sessionId));

  const token: Token = {
    sessionId: sessionId
  };

  getData().activeUsers.push({
    token: token,
    user: userId
  });

  return { sessionId: sessionId };
}

// converts session id to token string
export function stringifyToken(token: Token): string {
  return token.sessionId.toString();
}

// converts token string to session id
export function parseTokenString(tokenString: string): Token {
  return {
    sessionId: parseInt(tokenString)
  };
}

// generates unique user id
export function generateUniqueNumberId(): number {
  return Number(parse(uuidv4()).join('').slice(0, 8));
}

// returns active user id given token
export function findActiveUser(token: Token): UserID | undefined {
  const activeUser = getData().activeUsers.find(activeUser => activeUser.token.sessionId === token.sessionId);
  return activeUser ? activeUser.user : undefined;
}

// returns auth user id given token
export function getUserByToken(token: string): User | undefined {
  const authUserId = findActiveUser(parseTokenString(token));
  if (!authUserId) {
    return undefined;
  }

  const user = getData().users.find(user => user.authUserId === authUserId);
  return user;
}

// returns quiz object given quiz id and owner id
export function getQuizById(quizId: number, user: User): Quiz | undefined {
  const data = getData();
  const quiz = data.quizzes.find(idx => idx.quizId === quizId);
  if (!quiz) {
    return undefined;
  }
  if (quiz.ownerId !== user.authUserId) {
    return undefined;
  }
  return quiz;
}

// returns question object given quiz object and question id
export function getQuestion(quiz: Quiz, questionId: number): Question | undefined {
  return quiz.questions.find(idx => idx.questionId === questionId) || undefined;
}

// returns random colour
export function getRandomColour(): string {
  const colours: string[] = ['red', 'blue', 'green', 'yellow',
    'purple', 'brown', 'orange'];
  const randomIndex: number = Math.floor(Math.random() * colours.length);
  return colours[randomIndex];
}

// generates random name for visitors
export function generateRandomName(players: Player[]): string {
  const getRandomElement = (array: string[]): string => {
    const index = Math.floor(Math.random() * array.length);
    return array.splice(index, 1)[0];
  };

  const generateUniqueName = (): string => {
    const letters: string[] = Array.from('abcdefghijklmnopqrstuvwxyz');
    const numbers: string[] = Array.from('0123456789');
    let name = '';
    for (let i = 0; i < 5; i++) {
      name += getRandomElement(letters);
    }
    for (let i = 0; i < 3; i++) {
      name += getRandomElement(numbers);
    }
    return name;
  };

  const newName = generateUniqueName();
  return newName;
}

// generates unique player ID by incrementing current timestamp
export function uniquePlayerId(players: Player[]): PlayerID {
  let playerId: PlayerID;

  do {
    playerId = Date.now();
  } while (players.some(player => player.playerId === playerId));

  return playerId;
}

// generate question results for a quiz session
//  identifying correct answers, calculating answer times,
// updating scores, and computing statistics like
// average answer time and percentage of correct answers.
export function playerQuestionResultsHelper(
  quizSession: QuizSession, question: Question,
  questionPosition: number, scores?: number[], questionRankings?: number[]): QuestionResult {
  const data = getData();

  // Get other players in the session
  const players: Player[] = data.activePlayers.filter(
    activePlayer => quizSession.players.includes(activePlayer.playerId)
  );

  // get the Ids of the correct answers to the question
  const correctAnswers: AnswerID[] = question.answers
    .filter(answer => answer.correct === true)
    .map(answer => answer.answerId);

  // playersCorrect stores the indexes of players that answered correctly
  const playersCorrect: number[] = [];

  // Each index of answerTimes relates to playerIndex
  // example: player[0] has answer time answerTimes[0]
  const answerTimes: number[] = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];

    // player's answers match the correct answers
    if (player.answerSubmissions[questionPosition].length === correctAnswers.length &&
      player.answerSubmissions[questionPosition].every(submittedAnswerId => correctAnswers.includes(submittedAnswerId))) {
      playersCorrect.push(i);
    }
    const answerTime = (new Date(player.submissionTimes[questionPosition]).getTime() / 1000) - (new Date(quizSession.questionStartTimes[questionPosition]).getTime() / 1000);
    answerTimes.push(answerTime);
  }

  // ranking the indexes of players who got the correct answers
  const rankings = playersCorrect.sort((lhs: number, rhs: number) => answerTimes[lhs] - answerTimes[rhs]);
  // Update the scores which is the points multiplied by the scaling factor
  for (let i = 0; i < rankings.length; i++) {
    questionRankings.push(rankings[i]);
    scores[rankings[i]] += question.points * 1 / (i + 1);
  }
  // Calculate the total answer time
  const totalAnswerTime = answerTimes.reduce((acc, curr) => acc + curr, 0);

  // Calculate the average answer time
  const averageAnswerTime = totalAnswerTime / answerTimes.length;

  return {
    questionId: question.questionId,
    playersCorrectList: playersCorrect.map(i => players[i].name).sort((lhs, rhs) => lhs.localeCompare(rhs)),
    averageAnswerTime: averageAnswerTime,
    percentCorrect: Math.round(playersCorrect.length / players.length * 100)
  };
}
