import {
  requestClear, requestAdminAuthRegister, requestAdminAuthLogout,
  requestAdminQuizCreate, requestAdminQuizQuestionCreate,
  requestAdminQuizSessionStart, requestAdminQuizSessionStatus,
  requestAdminQuizTransferOwner,
  requestAdminQuizInfo,
} from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

let quiz0: { quizId: number };
let user0: { token: string };
let user1: { token: string };

let session0: { sessionId: number };

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
    duration: 3,
    points: 5,
    thumbnailUrl: 'http://google.com/some/image/path.jpg'
  };
  requestAdminQuizQuestionCreate(user0.token, quiz0.quizId, question);
});

describe('adminQuizSessionStatus - success', () => {
  beforeEach(() => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
  });

  test('valid case - session started', () => {
    const response = requestAdminQuizSessionStatus(user0.token, quiz0.quizId, session0.sessionId);
    expect(response).toEqual({
      state: 'LOBBY',
      atQuestion: -1,
      players: [],
      metadata: {
        quizInfo: requestAdminQuizInfo(user0.token, quiz0.quizId)
      },
    });
  });
});

describe('adminQuizSessionStatus - error 400', () => {
  test('invalid quiz ID', () => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    expect(requestAdminQuizSessionStatus(user0.token, 999, session0.sessionId)).toStrictEqual(ERROR400);
  });

  test('invalid session ID', () => {
    expect(requestAdminQuizSessionStatus(user0.token, quiz0.quizId, 999)).toStrictEqual(ERROR400);
  });
});

describe('adminQuizSessionStatus - error 401', () => {
  beforeEach(() => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
  });

  test('token missing', () => {
    expect(requestAdminQuizSessionStatus('', quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    expect(requestAdminQuizSessionStatus('999', quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });

  test('token expired', () => {
    requestAdminAuthLogout(user0.token);
    expect(requestAdminQuizSessionStatus(user0.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR401);
  });
});

describe('adminQuizSessionStatus - error 403', () => {
  beforeEach(() => {
    session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
  });

  test('user not owner', () => {
    expect(requestAdminQuizSessionStatus(user1.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR403);
  });

  test('quiz transfer', () => {
    requestAdminQuizTransferOwner(user0.token, quiz0.quizId, 'test1@gmail.com');
    expect(requestAdminQuizSessionStatus(user0.token, quiz0.quizId, session0.sessionId)).toStrictEqual(ERROR403);
  });
});
