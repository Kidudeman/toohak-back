import { requestAdminAuthRegister, requestAdminQuizCreate, requestClear } from './requests';

const ERROR = { error: expect.any(String), status: 400 };

describe('adminQuizCreate invalid quiz name', () => {
  let user: { token: string };
  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('ami@gmail.com', 'test!1Example', 'ami', 'kumar');
  });

  // Quiz name contains invalid (Not alphanumeric or spaces) characters
  test('Invalid character #', () => {
    expect(requestAdminQuizCreate(user.token, 'Quiz#', 'This is a new quiz')).toStrictEqual(ERROR);
  });

  test('Invalid character`` ', () => {
    expect(requestAdminQuizCreate(user.token, 'Quiz``+', 'This is a new quiz')).toStrictEqual(ERROR);
  });

  test('Name length < 3 characters ', () => {
    expect(requestAdminQuizCreate(user.token, 'Q', 'This is a new quiz')).toStrictEqual(ERROR);
  });

  test('Empty name ', () => {
    expect(requestAdminQuizCreate(user.token, '', 'This is a new quiz')).toStrictEqual(ERROR);
  });

  // Quiz name is either less than 3 characters or more than 30 characters long
  test('Name length > 30 characters', () => {
    expect(requestAdminQuizCreate(user.token, 'This is a very long quiz name that exceeds the character limits', 'This is a new quiz')).toStrictEqual(ERROR);
  });

  test('Name length with special characters > 30 characters', () => {
    expect(requestAdminQuizCreate(user.token, 'This is a long quiz name that exceeds the character limit@#$%^&*', 'This is a new quiz')).toStrictEqual(ERROR);
  });

  test('Name length with numbers > 30 characters ', () => {
    expect(requestAdminQuizCreate(user.token, 'Quiz12345678901234567890123456789', 'This is a new quiz')).toStrictEqual(ERROR);
  });

  // Quiz name is already used by the current logged in user for another active quiz
  test('Name is already used by the current user for another quiz', () => {
    requestAdminQuizCreate(user.token, 'Quiz 1', 'Test Quiz 1');
    expect(requestAdminQuizCreate(user.token, 'Quiz 1', 'This is a new quiz')).toStrictEqual(ERROR);
  });
});

describe('adminQuizCreate invalid quiz description', () => {
  let user: { token: string };
  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('ami@gmail.com', 'test!1Example', 'ami', 'kumar');
  });

  // Test case for an invalid description
  test('Invalid description (more than 100 characters)', () => {
    expect(requestAdminQuizCreate(user.token, 'New Quiz', 'This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit. This is a very long description that exceeds the character limit.')).toStrictEqual(ERROR);
  });
});

describe('adminQuizCreate valid quiz names', () => {
  let user: { token: string };
  let user1: { token: string };
  let user2: { token: string };
  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('ami@gmail.com', 'test!1Example', 'ami', 'kumar');
    user1 = requestAdminAuthRegister('ami1@gmail.com', 'test!1Example', 'amit', 'kumar');
    user2 = requestAdminAuthRegister('ami2@gmail.com', 'test!1Example', 'amit', 'kumar');
  });

  // Test cases for valid quiz details
  test('Creating 1 quiz with valid details', () => {
    const result = requestAdminQuizCreate(user.token, 'New Quiz', 'This is a new quiz');
    expect(result.quizId).toStrictEqual(expect.any(Number));
  });

  test('Creating 2 quizzes with valid details', () => {
    requestAdminQuizCreate(user.token, 'Quiz 1', 'This is Quiz 1');
    const result = requestAdminQuizCreate(user.token, 'Quiz 2', 'This is Quiz 2');
    expect(result.quizId).toStrictEqual(expect.any(Number));
  });

  test('Creating multiple quizzes with valid details', () => {
    requestAdminQuizCreate(user.token, 'Quiz 1', 'This is Quiz 1');
    requestAdminQuizCreate(user.token, 'Quiz 2', 'This is Quiz 2');
    requestAdminQuizCreate(user.token, 'Quiz 3', 'This is Quiz 3');
    const result = requestAdminQuizCreate(user.token, 'Quiz 4', 'This is Quiz 4');
    expect(result.quizId).toStrictEqual(expect.any(Number));
  });

  test('Creating 2 quizzes with the same name but different users', () => {
    const result1 = requestAdminQuizCreate(user1.token, 'Quiz', 'This is Quiz 1');
    const result2 = requestAdminQuizCreate(user2.token, 'Quiz', 'This is Quiz 2');
    expect(result1.quizId).toStrictEqual(expect.any(Number));
    expect(result2.quizId).toStrictEqual(expect.any(Number));
  });
});
