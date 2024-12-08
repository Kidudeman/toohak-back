import { requestAdminAuthRegister, requestAdminQuizCreate, requestAdminQuizInfo, requestAdminQuizList, requestAdminQuizRemove, requestClear } from './requests';

const ERROR401 = { error: expect.any(String), status: 401 };
// const ERROR400 = { error: expect.any(String), status: 400  };
const ERROR403 = { error: expect.any(String), status: 403 };

describe('adminQuizRemove', () => {
  let user1: { token: string };
  let user2: { token: string };
  let quiz1: { quizId: number };
  let quiz2: { quizId: number };
  beforeEach(() => {
    requestClear();
    user1 = requestAdminAuthRegister('test1.example@gmail.com', 'test@Exampl1e', 'test', 'example');
    quiz1 = requestAdminQuizCreate(user1.token, 'Quiz', 'Test Quiz');
    user2 = requestAdminAuthRegister('test2.example2@gmail.com', 'Test@Example2', 'andrew', 'examplee');
    quiz2 = requestAdminQuizCreate(user2.token, 'quiz2', 'Test quiz2');
  });

  test('adminQuizRemove is valid', () => {
    const quizId = quiz1.quizId;

    expect(requestAdminQuizRemove(user1.token, quiz1.quizId)).toStrictEqual({});
    expect(requestAdminQuizList(user1.token)).toStrictEqual({ quizzes: [] });

    expect(requestAdminQuizInfo(user1.token, quizId)).toStrictEqual(ERROR403);
  });

  // Since there is only one authUserId, -authUserId will not a be valid authUserId.
  test('AuthUserId is not a valid user', () => {
    const invalidToken = (-parseInt(user1.token)).toString();

    expect(requestAdminQuizRemove(invalidToken, quiz1.quizId)).toStrictEqual(ERROR401);
    expect(requestAdminQuizList(user1.token)).toStrictEqual(
      {
        quizzes: [
          {
            quizId: quiz1.quizId,
            name: 'Quiz'
          }
        ]
      });
  });

  // Since there is only one quizId, quizId + 1 will not be a valid authUserId.
  test('quizId is not a valid quiz', () => {
    expect(requestAdminQuizRemove(user1.token, quiz1.quizId + 1)).toStrictEqual(ERROR403);
    expect(requestAdminQuizList(user1.token)).toStrictEqual(
      {
        quizzes: [
          {
            quizId: quiz1.quizId,
            name: 'Quiz'
          }
        ]
      });
  });

  test('Both quizId and AuthUserId are not valid', () => {
    const invalidToken = (-parseInt(user1.token)).toString();
    expect(requestAdminQuizRemove(invalidToken, quiz1.quizId + 1)).toStrictEqual(ERROR401);
    expect(requestAdminQuizList(user1.token)).toStrictEqual(
      {
        quizzes: [
          {
            quizId: quiz1.quizId,
            name: 'Quiz'
          }
        ]
      });
  });

  test('Quiz ID does not refer to a quiz that this user owns.', () => {
    expect(requestAdminQuizRemove(user1.token, quiz2.quizId)).toStrictEqual(ERROR403);
    expect(requestAdminQuizList(user1.token)).toStrictEqual(
      {
        quizzes: [
          {
            quizId: quiz1.quizId,
            name: 'Quiz'
          }
        ]
      }
    );
    expect(requestAdminQuizList(user2.token)).toStrictEqual(
      {
        quizzes: [
          {
            quizId: quiz2.quizId,
            name: 'quiz2'
          }
        ]
      }
    );
  });
});
