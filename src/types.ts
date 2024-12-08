export enum QuizState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}

export enum QuizAction {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END'
}

export type SessionID = number;
export type UserID = number;
export type QuizID = number;
export type QuizSessionId = number;
export type AnswerID = number;
export type PlayerID = number;
export type QuestionID = number;

export interface ActiveUser {
  token: Token;
  user: UserID;
}

export interface User {
  authUserId: UserID;
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string;
  successfulLogins: number;
  failedLogins: number;
  oldPasswords: string[];
  quizList: number[];
}

export interface Player {
  quizSessionId: QuizSessionId;
  name: string;
  playerId: PlayerID;
  submissionTimes: number[];
  answerSubmissions: AnswerID[][];
}

export interface QuizSession {
  quizSessionId: number;
  state: QuizState;
  atQuestion: number;
  players: PlayerID[];
  quizId: QuizID;
  autoStartNum: number;
  questionStartTimes: number[];
  questionTimerHandler?: ReturnType<typeof setTimeout>;
  messages: Message[];
  quizCopy: Quiz,
}

export interface Quiz {
  quizId: QuizID;
  ownerId: UserID;
  name: string;
  description: string;
  timeCreated: number;
  timeLastEdited: number;
  playerIds: number[];
  questions: Question[];
  duration: number;
  thumbnailUrl: string;
  sessions: QuizSessionId[];
}

export interface Question {
  questionId: number;
  question: string;
  answers: Answer[];
  duration: number;
  thumbnailUrl: string;
  points: number;
}

export interface Answer {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface Token {
  sessionId: SessionID;
}

export interface UserDetails {
  userId: number;
  name: string;
  email: string;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
}

export interface QuizList {
  quizId: QuizID;
  name: string;
}

export interface QuizSessionStatus {
  state: QuizState;
  atQuestion: number;
  players: string[];
  metadata: {
    quizInfo: QuizInfo;
  }
}

export interface QuizResults {
  usersRankedByScore: {name: string, score: number}[];
  questionResults: QuestionResult[];
}

export interface Message {
  messageBody: string;
  playerId: number;
  playerName: string;
  timeSent: number;
}

export interface QuestionResult {
  questionId: number,
  playersCorrectList: string[],
  averageAnswerTime: number,
  percentCorrect: number
}

export interface PlayerQuestionInfo {
  questionId: number;
  question: string;
  duration: number;
  thumbnailUrl: string;
  points: number;
  answers: {
    answerId: number;
    answer: string;
    colour: string;
  }[];
}

export interface QuizInfo {
  quizId: QuizID;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Question[];
  duration: number;
  thumbnailUrl: string;
}

export interface QuestionBody {
  question: string;
  duration: number;
  points: number;
  answers: {answer: string, correct: boolean}[];
  thumbnailUrl: string;
}

export interface QuizSessionInfo {
  activeSessions: number[];
  inactiveSessions: number[];
}
