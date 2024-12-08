import {
  requestClear, requestAdminAuthRegister, requestAdminAuthLogout,
  requestAdminQuizCreate, requestAdminQuizRemove,
  requestAdminQuizQuestionCreate, requestAdminQuizQuestionDelete,
  requestAdminQuizTransferOwner,
  //   requestAdminQuizSessionsView,
  requestAdminQuizSessionStart,
} from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

let quiz0: { quizId: number };
let question0: { questionId: number };
let user0: { token: string };
let user1: { token: string };

beforeEach(() => {
  requestClear();
  user0 = requestAdminAuthRegister('test0@gmail.com', 'Password0', 'First', 'Last');
  quiz0 = requestAdminQuizCreate(user0.token, 'Test', 'Test');

  const question = {
    question: 'What is the meaning of life?',
    answers: [
      { answer: '42', correct: true },
      { answer: 'love', correct: false },
      { answer: 'one', correct: false },
      { answer: 'x', correct: false }
    ],
    duration: 30,
    points: 5,
    thumbnailUrl: 'http://google.com/some/image/path.jpg'
  };
  question0 = requestAdminQuizQuestionCreate(user0.token, quiz0.quizId, question);
});

describe('adminQuizSessionStart - success !', () => {
  test('valid case', () => {
    expect(requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1)).toStrictEqual({ sessionId: expect.any(Number) });
  });

  test('valid case', () => {
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    expect(requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1)).toStrictEqual({ sessionId: expect.any(Number) });
  });
});

describe('adminQuizSessionStart - error 400', () => {
  test('auto start over limit', () => {
    expect(requestAdminQuizSessionStart(user0.token, quiz0.quizId, 51)).toStrictEqual(ERROR400);
  });

  test('no questions in quiz', () => {
    requestAdminQuizQuestionDelete(user0.token, quiz0.quizId, question0.questionId);
    expect(requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1)).toStrictEqual(ERROR400);
  });

  test('quiz in trash', () => {
    requestAdminQuizRemove(user0.token, quiz0.quizId);
    expect(requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1)).toStrictEqual(ERROR400);
  });

  test('active sessions over limit', () => {
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    expect(requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1)).toStrictEqual(ERROR400);
  });
});

describe('adminQuizSessionStart - error 401', () => {
  test('token missing', () => {
    expect(requestAdminQuizSessionStart('', quiz0.quizId, 1)).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    expect(requestAdminQuizSessionStart('999', quiz0.quizId, 1)).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    requestAdminAuthLogout(user0.token);
    expect(requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1)).toStrictEqual(ERROR401);
  });
});

describe('adminQuizSessionStart - error 403', () => {
  test('user not owner', () => {
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
    expect(requestAdminQuizSessionStart(user1.token, quiz0.quizId, 1)).toStrictEqual(ERROR403);
  });

  test('quiz transfer', () => {
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
    requestAdminQuizTransferOwner(user0.token, quiz0.quizId, 'test1@gmail.com');
    expect(requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1)).toStrictEqual(ERROR403);
  });
});
