import {
  requestClear, requestAdminAuthRegister, requestAdminAuthLogout,
  requestAdminQuizCreate, requestAdminQuizQuestionCreate,
  requestAdminQuizTransferOwner,
  requestAdminQuizSessionStart, requestAdminQuizSessionState,
  requestAdminQuizSessionsView,
} from './requests';

const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

let quiz0: { quizId: number };
let user0: { token: string };
let user1: { token: string };

let session1: { sessionId: number };
let session2: { sessionId: number };
let session3: { sessionId: number };

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

describe('adminQuizSessionsView - success !', () => {
  test('valid case', () => {
    expect(requestAdminQuizSessionsView(user0.token, quiz0.quizId)).toStrictEqual({
      activeSessions: [],
      inactiveSessions: []
    });
  });

  test('valid case', () => {
    session1 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    expect(requestAdminQuizSessionsView(user0.token, quiz0.quizId)).toStrictEqual({
      activeSessions: [session1.sessionId],
      inactiveSessions: []
    });
  });

  test('valid case', () => {
    session1 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
    session2 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 2);
    session3 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 3);
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session1.sessionId, 'GO_TO_ANSWER');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session2.sessionId, 'NEXT_QUESTION');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session3.sessionId, 'END');
    expect(requestAdminQuizSessionsView(user0.token, quiz0.quizId)).toStrictEqual({
      activeSessions: [session1.sessionId, session2.sessionId],
      inactiveSessions: [session3.sessionId]
    });
  });
});

describe('adminQuizSessionsView - error 401', () => {
  test('token missing', () => {
    expect(requestAdminQuizSessionsView('', quiz0.quizId)).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    expect(requestAdminQuizSessionsView('999', quiz0.quizId)).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    requestAdminAuthLogout(user0.token);
    expect(requestAdminQuizSessionsView(user0.token, quiz0.quizId)).toStrictEqual(ERROR401);
  });
});

describe('adminQuizSessionsView - error 403', () => {
  test('user not owner', () => {
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
    expect(requestAdminQuizSessionsView(user1.token, quiz0.quizId)).toStrictEqual(ERROR403);
  });

  test('quiz transfer', () => {
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
    requestAdminQuizTransferOwner(user0.token, quiz0.quizId, 'test1@gmail.com');
    expect(requestAdminQuizSessionsView(user0.token, quiz0.quizId)).toStrictEqual(ERROR403);
  });
});
