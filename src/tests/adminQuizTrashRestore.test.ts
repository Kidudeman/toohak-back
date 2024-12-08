import {
  requestClear,
  requestAdminAuthRegister,
  requestAdminAuthLogout,
  requestAdminQuizCreate,
  requestAdminQuizInfo,
  requestAdminQuizRemove,
  requestAdminQuizTrashRestore,
} from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

let quiz0: { quizId: number };
let user0: { token: string };

beforeEach(() => {
  requestClear();
  user0 = requestAdminAuthRegister('me1@gmail.com', 'Password1!', 'First-i', 'Last-i');
  quiz0 = requestAdminQuizCreate(user0.token, 'My Quiz', 'A test quiz');
});

describe('adminQuizTrashRestore - success !', () => {
  beforeEach(() => {
    requestAdminQuizRemove(user0.token, quiz0.quizId);
  });

  test('valid case', () => {
    expect(requestAdminQuizTrashRestore(user0.token, quiz0.quizId)).toStrictEqual({});
  });

  test('time last edited', () => {
    const info0 = requestAdminQuizInfo(user0.token, quiz0.quizId);
    requestAdminQuizTrashRestore(user0.token, quiz0.quizId);
    expect(info0.timeLastEdited).not.toStrictEqual(requestAdminQuizInfo(user0.token, quiz0.quizId).timeLastEdited);
  });
});

describe('adminQuizTrashRestore - error 400', () => {
  test('quiz not in trash', () => {
    expect(requestAdminQuizTrashRestore(user0.token, quiz0.quizId)).toStrictEqual(ERROR400);
  });

  test('quiz name in use', () => {
    requestAdminQuizRemove(user0.token, quiz0.quizId);
    requestAdminQuizCreate(requestAdminAuthRegister('me2@gmail.com', 'Password2!', 'First-ii', 'Last-ii').token, 'My Quiz', 'Another test quiz');
    expect(requestAdminQuizTrashRestore(user0.token, quiz0.quizId)).toStrictEqual(ERROR400);
  });
});

describe('adminQuizTrashRestore - error 401', () => {
  beforeEach(() => {
    requestAdminQuizRemove(user0.token, quiz0.quizId);
  });

  test('token missing', () => {
    expect(requestAdminQuizTrashRestore('', quiz0.quizId)).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    requestAdminAuthLogout(user0.token);
    expect(requestAdminQuizTrashRestore(user0.token.repeat(2), quiz0.quizId)).toStrictEqual(ERROR401);
  });
});

describe('adminQuizTrashRestore - error 403', () => {
  beforeEach(() => {
    requestAdminQuizRemove(user0.token, quiz0.quizId);
  });

  test('quiz id invalid', () => {
    expect(requestAdminQuizTrashRestore(user0.token, -1)).toStrictEqual(ERROR403);
  });

  test('user not owner', () => {
    expect(requestAdminQuizTrashRestore(requestAdminAuthRegister('me2@gmail.com', 'Password2!', 'First-ii', 'Last-ii').token, quiz0.quizId)).toStrictEqual(ERROR403);
  });
});

/*

  ERROR 400:
      - quiz name is already used by another active quiz
      - quiz id refers to quiz not currently in trash

  ERROR 401:
      - token is empty or invalid (requires valid user session)

  ERROR 403:
      - token is valid, but quiz id is invalid
      - token is valid, but user does not own quiz

  */
