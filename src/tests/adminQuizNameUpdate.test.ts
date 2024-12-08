import { requestAdminQuizNameUpdate, requestAdminAuthRegister, requestAdminQuizCreate, requestAdminQuizInfo, requestClear } from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

describe('requestAdminQuizNameUpdate', () => {
  let user: {token: string};
  let user1: {token: string};
  let quiz: {quizId: number};

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('tom@gmail.com', 'Password111', 'Tom', 'Smith');
    quiz = requestAdminQuizCreate(user.token, 'FunQuiz', 'A quiz to make tests');
  });

  // invalid authId
  test('AuthUserId does not refer to a valid user.', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminQuizNameUpdate(invalidToken, quiz.quizId, 'Best Quiz')).toStrictEqual(ERROR401);
  });

  // invalid quiz
  test('QuizId does not refer to a valid quiz.', () => {
    expect(requestAdminQuizNameUpdate(user.token, (quiz.quizId + 1), 'Best Quiz')).toStrictEqual(ERROR403);
  });

  // Quiz not owned by user
  test('The user authUserId refers to does not own this quiz.', () => {
    user1 = requestAdminAuthRegister('max@gmail.com', 'Password222', 'Max', 'Blend');
    expect(requestAdminQuizNameUpdate(user1.token, quiz.quizId, 'Best Quiz')).toStrictEqual(ERROR403);
  });

  // Invalid quiz name characters
  test('Invalid characters used.', () => {
    expect(requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Best Quiz _')).toStrictEqual(ERROR400);
  });
  test('Invalid characters used.', () => {
    expect(requestAdminQuizNameUpdate(user.token, quiz.quizId, '*Best Quiz ')).toStrictEqual(ERROR400);
  });
  test('Invalid characters used.', () => {
    expect(requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Best&Quiz')).toStrictEqual(ERROR400);
  });
  test('Invalid characters used.', () => {
    expect(requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Best Quiz/')).toStrictEqual(ERROR400);
  });

  // quiz name too short
  test('Quiz name too short.', () => {
    expect(requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Be')).toStrictEqual(ERROR400);
  });

  // quiz name too long
  test('Quiz name too long.', () => {
    expect(requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Best Quiz but lets make this quiz name way too long')).toStrictEqual(ERROR400);
  });

  // Name is already used for another quiz created bu the same user
  test('The user has already used this name for another quiz.', () => {
    requestAdminQuizCreate(user.token, 'Best Quiz', 'A quiz to make tests');
    expect(requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Best Quiz')).toStrictEqual(ERROR400);
  });

  // test correct output
  test('Test correct output.', () => {
    expect(requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Best Quiz')).toStrictEqual({});
  });

  // test name is correctly updated
  test('Test name correctly updated', () => {
    requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Best Quiz');
    const updatedQuiz = requestAdminQuizInfo(user.token, quiz.quizId);
    expect(updatedQuiz.name).toStrictEqual('Best Quiz');
  });
});
