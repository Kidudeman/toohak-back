import { requestAdminAuthRegister, requestAdminQuizCreate, requestAdminQuizInfo, requestClear } from './requests';

// const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

describe('adminQuizInfo', () => {
  let user: { token: string };
  let quiz: { quizId: number };
  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('test.example@gmail.com', 'test!1Example', 'amit', 'kumar');
    quiz = requestAdminQuizCreate(user.token, 'Quiz', 'Test Quiz');
  });
  test('adminQuizInfo is valid', () => {
    expect(requestAdminQuizInfo(user.token, quiz.quizId)).toEqual({
      quizId: quiz.quizId,
      name: 'Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Test Quiz',
      numQuestions: 0,
      questions: [],
      duration: 0,
      thumbnailUrl: ''
    });
  });

  // Since there is only one authUserId, -authUserId will not be valid.
  test('AuthUserId is not a valid user', () => {
    const invalidToken = (-parseInt(user.token)).toString();

    expect(requestAdminQuizInfo(invalidToken, quiz.quizId)).toEqual(ERROR401);
  });

  // Since there is only one quizId, quizId + 1 will not be valid.
  test('quizId is not a valid quiz', () => {
    expect(requestAdminQuizInfo(user.token, quiz.quizId + 1)).toEqual(ERROR403);
  });

  test('Both quizId and AuthUserId are not valid', () => {
    const invalidToken = (-parseInt(user.token)).toString();

    expect(requestAdminQuizInfo(invalidToken, quiz.quizId + 1)).toEqual(ERROR401);
  });

  test('Quiz ID does not refer to a quiz that this user owns.', () => {
    const user2 = requestAdminAuthRegister('test.example2@gmail.com', 'testExample2', 'test2', 'example2');
    const quiz2 = requestAdminQuizCreate(user2.token, 'Quiz2', 'Test Quiz2');
    expect(requestAdminQuizInfo(user.token, quiz2.quizId)).toEqual(ERROR403);
  });
});
