import {
  requestClear,
  requestAdminAuthRegister,
  requestAdminAuthLogout,
  requestAdminQuizCreate,
  requestAdminQuizRemove,
  requestAdminQuizTrashView,
  requestAdminQuizTrashEmpty,
} from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

let user0: { token: string };
let quiz0: { quizId: number };
let quiz1: { quizId: number };
let quiz2: { quizId: number };

beforeEach(() => {
  requestClear();
  user0 = requestAdminAuthRegister('me1@gmail.com', 'Password1!', 'First-i', 'Last-i');
  quiz0 = requestAdminQuizCreate(user0.token, 'My Quiz 0', 'A test quiz 0');
  quiz1 = requestAdminQuizCreate(user0.token, 'My Quiz 1', 'A test quiz 1');
  quiz2 = requestAdminQuizCreate(user0.token, 'My Quiz 2', 'A test quiz 2');
});

describe('requestAdminQuizTrashEmpty - success !', () => {
  beforeEach(() => {
    requestAdminQuizRemove(user0.token, quiz0.quizId);
  });

  test('valid case - single', () => {
    expect(requestAdminQuizTrashEmpty(user0.token, [quiz0.quizId])).toStrictEqual({});
  });

  test('valid case - several', () => {
    requestAdminQuizRemove(user0.token, quiz1.quizId);
    requestAdminQuizRemove(user0.token, quiz2.quizId);
    expect(requestAdminQuizTrashEmpty(user0.token, [quiz0.quizId, quiz1.quizId, quiz2.quizId])).toStrictEqual({});
  });

  test('trash quiz view', () => {
    requestAdminQuizTrashEmpty(user0.token, [quiz0.quizId]);
    expect(requestAdminQuizTrashView(user0.token)).toStrictEqual({ quizzes: [] });
  });
});

describe('requestAdminQuizTrashEmpty - error 400', () => {
  test('quiz not in trash - single', () => {
    expect(requestAdminQuizTrashEmpty(user0.token, [quiz0.quizId])).toStrictEqual(ERROR400);
  });

  test('quiz not in trash - several', () => {
    requestAdminQuizRemove(user0.token, quiz1.quizId);
    requestAdminQuizRemove(user0.token, quiz2.quizId);
    expect(requestAdminQuizTrashEmpty(user0.token, [quiz0.quizId, quiz1.quizId, quiz2.quizId])).toStrictEqual(ERROR400);
  });
});

describe('requestAdminQuizTrashEmpty - error 401', () => {
  beforeEach(() => {
    requestAdminQuizRemove(user0.token, quiz0.quizId);
  });

  test('token missing', () => {
    expect(requestAdminQuizTrashEmpty('', [quiz0.quizId])).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    requestAdminAuthLogout(user0.token);
    expect(requestAdminQuizTrashEmpty(user0.token.repeat(2), [quiz0.quizId])).toStrictEqual(ERROR401);
  });
});

describe('requestAdminQuizTrashEmpty - error 403', () => {
  beforeEach(() => {
    requestAdminQuizRemove(user0.token, quiz0.quizId);
  });

  test('quiz id invalid', () => {
    expect(requestAdminQuizTrashEmpty(user0.token, [quiz0.quizId, -1])).toStrictEqual(ERROR403);
  });

  test('user not owner', () => {
    expect(requestAdminQuizTrashEmpty(requestAdminAuthRegister('me2@gmail.com', 'Password2!', 'First-ii', 'Last-ii').token, [quiz0.quizId])).toStrictEqual(ERROR403);
  });
});

/*

  ERROR 400:
      - quiz id refers to quiz not currently in trash

  ERROR 401:
      - token is empty or invalid (requires valid user session)

  ERROR 403:
      - token is valid, but quiz id is invalid
      - token is valid, but user does not own quiz

  */
