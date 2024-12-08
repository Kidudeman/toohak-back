import {
  requestClear, requestAdminAuthRegister, requestAdminAuthLogout,
  requestAdminQuizCreate, requestAdminQuizQuestionCreate,
  requestAdminQuizSessionStart, requestAdminQuizSessionResultsLink,
  requestAdminQuizTransferOwner, requestAdminQuizSessionState,
  requestPlayerSessionJoin, requestPlayerQuestionAnswer,
  requestAdminQuizInfo
} from './requests';
import { QuestionBody } from '../testTypes';

async function sleep(ms: number): Promise<undefined> {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

let quiz0: { quizId: number };
let user0: { token: string };
let user1: { token: string };
let player0: { playerId: number };
let player1: { playerId: number };
let player2: { playerId: number };

let session0: { sessionId: number };

beforeEach(() => {
  requestClear();
  user0 = requestAdminAuthRegister('test0@gmail.com', 'Password0', 'First', 'Last');
  quiz0 = requestAdminQuizCreate(user0.token, 'Test', 'Test');

  const questionbody1: QuestionBody = {
    question: 'What is the meaning of life?',
    answers: [
      { answer: '42', correct: true },
      { answer: 'love', correct: false },
      { answer: 'one', correct: false },
      { answer: 'x', correct: false }
    ],
    duration: 3,
    points: 5,
    thumbnailUrl: 'http://google.com/some/image/path.jpg'
  };

  requestAdminQuizQuestionCreate(user0.token, quiz0.quizId, questionbody1);
});

describe('adminQuizSessionResultsLink - success', () => {
  beforeEach(async () => {
    const questionbody2: QuestionBody = {
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
    requestAdminQuizQuestionCreate(user0.token, quiz0.quizId, questionbody2);

    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 3);
    player0 = requestPlayerSessionJoin(session0.sessionId, 'Hayden');
    player1 = requestPlayerSessionJoin(session0.sessionId, 'Andrew');
    player2 = requestPlayerSessionJoin(session0.sessionId, 'Amit');

    // Set the quiz session to QUESTION_OPEN state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');

    // Simulate player answering the question
    const quizInfo = requestAdminQuizInfo(user0.token, quiz0.quizId);
    expect(requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[0].answers[0].answerId])).toStrictEqual({});
    expect(requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[0].answers[1].answerId])).toStrictEqual({});

    await sleep(100);
    expect(requestPlayerQuestionAnswer(player2.playerId, 1, [quizInfo.questions[0].answers[0].answerId])).toStrictEqual({});

    // Set the quiz session to ANSWER_SHOW state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');

    expect(requestPlayerQuestionAnswer(player0.playerId, 2, [quizInfo.questions[1].answers[0].answerId])).toStrictEqual({});
    expect(requestPlayerQuestionAnswer(player1.playerId, 2, [quizInfo.questions[1].answers[1].answerId])).toStrictEqual({});

    await sleep(100);
    expect(requestPlayerQuestionAnswer(player2.playerId, 2, [quizInfo.questions[1].answers[0].answerId])).toStrictEqual({});

    // Set the quiz session to FINAL_RESULTS state
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER')).toStrictEqual({});
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS')).toStrictEqual({});
  });

  test('valid case - session results link', () => {
    const response = requestAdminQuizSessionResultsLink(user0.token, quiz0.quizId, session0.sessionId);
    expect(response).toEqual({
      url: expect.stringMatching(/^http:\/\/localhost:\d+\/quiz_final_results_\d+\.csv$/)
    });
  });
});

describe('adminQuizSessionResultsLink - error 400', () => {
  test('invalid session ID', () => {
    expect(requestAdminQuizSessionResultsLink(user0.token, quiz0.quizId, 999)).toStrictEqual(ERROR400);
  });

  test('session not in FINAL_RESULTS state', () => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    expect(requestAdminQuizSessionResultsLink(user0.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR400);
  });
});

describe('adminQuizSessionResultsLink - error 401', () => {
  beforeEach(() => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    // Set the quiz session to ANSWER_SHOW state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');
    // Set the quiz session to FINAL_RESULTS state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS');
  });

  test('token missing', () => {
    expect(requestAdminQuizSessionResultsLink('', quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    expect(requestAdminQuizSessionResultsLink('999', quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });

  test('token expired', () => {
    requestAdminAuthLogout(user0.token);
    expect(requestAdminQuizSessionResultsLink(user0.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });
});

describe('adminQuizSessionResultsLink - error 403', () => {
  beforeEach(() => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    // Set the quiz session to ANSWER_SHOW state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');
    // Set the quiz session to FINAL_RESULTS state
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS');
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
  });

  test('user not owner', () => {
    expect(requestAdminQuizSessionResultsLink(user1.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR403);
  });

  test('invalid quizId', () => {
    expect(requestAdminQuizSessionResultsLink(user1.token, -quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR403);
  });

  test('quiz transfer', () => {
    requestAdminQuizTransferOwner(user0.token, quiz0.quizId, 'test1@gmail.com');
    expect(requestAdminQuizSessionResultsLink(user0.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR403);
  });
});
