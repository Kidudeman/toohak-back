export interface QuestionBody {
  question: string;
  duration: number;
  points: number;
  answers: Answer[];
  thumbnailUrl: string;
}

export interface Answer {
  answer: string;
  correct: boolean;
}

export interface QuizList {
  quizId: number;
  name: string;
}

export interface QuizInfo {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Question[];
  duration: number;
  thumbnailUrl: string;
}

export interface Question {
  questionId: number;
  question: string;
  answers: {
    answerId: number;
    answer: string;
    colour: string;
    correct: boolean;
  }[]
  duration: number;
  thumbnailUrl: string;
  points: number;
}

export interface QuizSessionStatus {
  state: QuizState;
  atQuestion: number;
  players: string[];
  metadata: {
    quizInfo: QuizInfo;
  }
}

export interface QuestionResult {
  questionId: number,
  playersCorrectList: string[],
  averageAnswerTime: number,
  percentCorrect: number
}

export interface QuizResults {
  usersRankedByScore: {name: string, score: number}[];
  questionResults: QuestionResult[];
}

export interface Message { messageBody: string; }

export type QuizAction = 'NEXT_QUESTION' | 'SKIP_COUNTDOWN' | 'GO_TO_ANSWER' | 'GO_TO_FINAL_RESULTS' | 'END';
export type QuizState = 'LOBBY' | 'QUESTION_COUNTDOWN' | 'QUESTION_OPEN' | 'QUESTION_CLOSE' | 'ANSWER_SHOW' | 'FINAL_RESULTS' | 'END'
