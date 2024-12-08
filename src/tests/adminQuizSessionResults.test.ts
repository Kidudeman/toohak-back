import {
  requestClear, requestAdminAuthRegister, requestAdminAuthLogout,
  requestAdminQuizCreate, requestAdminQuizQuestionCreate,
  requestAdminQuizSessionStart, requestAdminQuizSessionResults,
  requestAdminQuizTransferOwner, requestAdminQuizSessionState,
  requestPlayerSessionJoin, requestPlayerQuestionAnswer,
  requestAdminQuizInfo
} from './requests';
import { QuestionBody } from '../testTypes';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

let quiz0: { quizId: number };
let user0: { token: string };
let user1: { token: string };

let session0: { sessionId: number };
let question0: { questionId: number };

beforeEach(() => {
  requestClear();
  user0 = requestAdminAuthRegister('test0@gmail.com', 'Password0', 'First', 'Last');
  quiz0 = requestAdminQuizCreate(user0.token, 'Test', 'Test');
  const questionBody: QuestionBody = {
    question: 'What is the capital of France?',
    duration: 30,
    points: 10,
    answers: [
      { answer: 'Paris', correct: true },
      { answer: 'London', correct: false },
      { answer: 'Berlin', correct: false },
      { answer: 'Madrid', correct: false }
    ],
    thumbnailUrl: 'https://example.com/thumbnail.jpg'
  };

  question0 = requestAdminQuizQuestionCreate(user0.token, quiz0.quizId, questionBody);
});

describe('adminQuizSessionResults - success', () => {
  beforeEach(() => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);

    const playerResponse = requestPlayerSessionJoin(session0.sessionId, 'Hayden');

    // Set the quiz session to QUESTION_OPEN state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');

    // Simulate player answering the question
    const quizInfo = requestAdminQuizInfo(user0.token, quiz0.quizId);

    requestPlayerQuestionAnswer(playerResponse.playerId, 1, [quizInfo.questions[0].answers[0].answerId]);

    // Set the quiz session to ANSWER_SHOW state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');

    // Set the quiz session to FINAL_RESULTS state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS');
  });

  test('valid case - session results', () => {
    const response = requestAdminQuizSessionResults(user0.token, quiz0.quizId, session0.sessionId);
    expect(response).toEqual({
      usersRankedByScore: [
        {
          name: 'Hayden',
          score: 10
        }
      ],
      questionResults: [
        {
          questionId: question0.questionId,
          playersCorrectList: ['Hayden'],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100
        }
      ]
    });
  });
});

describe('adminQuizSessionResults - error 400', () => {
  test('invalid quiz ID', () => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    expect(requestAdminQuizSessionResults(user0.token, 999, session0.sessionId)).toStrictEqual(ERROR400);
  });

  test('invalid session ID', () => {
    expect(requestAdminQuizSessionResults(user0.token, quiz0.quizId, 999)).toStrictEqual(ERROR400);
  });

  test('session not in FINAL_RESULTS state', () => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    expect(requestAdminQuizSessionResults(user0.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR400);
  });
});

describe('adminQuizSessionResults - error 401', () => {
  beforeEach(() => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    // Set the quiz session to ANSWER_SHOW state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');
    // Set the quiz session to FINAL_RESULTS state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS');
  });

  test('token missing', () => {
    expect(requestAdminQuizSessionResults('', quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    expect(requestAdminQuizSessionResults('999', quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });

  test('token expired', () => {
    requestAdminAuthLogout(user0.token);
    expect(requestAdminQuizSessionResults(user0.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });
});

describe('adminQuizSessionResults - error 403', () => {
  beforeEach(() => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    // Set the quiz session to ANSWER_SHOW state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');
    // Set the quiz session to FINAL_RESULTS state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS');
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
  });

  test('user not owner', () => {
    expect(requestAdminQuizSessionResults(user1.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR403);
  });

  test('quiz transfer', () => {
    requestAdminQuizTransferOwner(user0.token, quiz0.quizId, 'test1@gmail.com');
    expect(requestAdminQuizSessionResults(user0.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR403);
  });
});
