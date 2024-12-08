import { requestAdminQuizDescriptionUpdate, requestAdminAuthRegister, requestAdminQuizCreate, requestAdminQuizInfo, requestClear } from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

describe('adminQuizDescriptionUpdate', () => {
  let user: {token: string};
  let user1: {token: string};
  let quiz: {quizId: number};

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('tom@gmail.com', 'Password111', 'Tom', 'Smith');
    quiz = requestAdminQuizCreate(user.token, 'FunQuiz', 'A quiz to make tests');
  });

  // invalid authId
  test('UserId does not refer to a valid user.', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminQuizDescriptionUpdate(invalidToken, quiz.quizId, 'new description of FunQuiz!')).toStrictEqual(ERROR401);
  });

  // invalid quiz
  test('QuizId does not refer to a valid quiz.', () => {
    expect(requestAdminQuizDescriptionUpdate(user.token, (quiz.quizId + 1), 'new description of FunQuiz!')).toStrictEqual(ERROR403);
  });

  // Quiz not owned by user
  test('The user UserId refers to does not own this quiz.', () => {
    user1 = requestAdminAuthRegister('max@gmail.com', 'Password222', 'Max', 'Blend');
    expect(requestAdminQuizDescriptionUpdate(user1.token, quiz.quizId, 'new description of FunQuiz!')).toStrictEqual(ERROR403);
  });

  // New description is more than 100 characters long
  test('New description too long, must not be more than 100 characters.', () => {
    expect(requestAdminQuizDescriptionUpdate(user.token, quiz.quizId, 'Quick quiz: Test your knowledge! 10 questions. Ready?Quick quiz: Test your knowledge! 10 questions. Ready?')).toStrictEqual(ERROR400);
  });

  // test correct output
  test('QuizId does not refer to a valid quiz.', () => {
    expect(requestAdminQuizDescriptionUpdate(user.token, quiz.quizId, 'new description of FunQuiz!')).toStrictEqual({});
  });

  // test description correctly updated
  test('Quiz description correctly updated.', () => {
    requestAdminQuizDescriptionUpdate(user.token, quiz.quizId, 'new description of FunQuiz!');
    const updatedQuiz = requestAdminQuizInfo(user.token, quiz.quizId);
    expect(updatedQuiz.description).toStrictEqual('new description of FunQuiz!');
  });
});
