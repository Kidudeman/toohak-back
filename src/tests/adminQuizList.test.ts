import { requestAdminQuizList, requestAdminQuizCreate, requestAdminAuthRegister, requestAdminQuizRemove, requestClear } from './requests';

const ERROR = { error: expect.any(String), status: 401 };

let user: { token: string };
let user1: { token: string };
let user2: { token: string };

beforeEach(() => {
  requestClear();
  user = requestAdminAuthRegister('test.example@gmail.com', 'test!1Example', 'amit', 'kumar');
  user1 = requestAdminAuthRegister('test.example1@gmail.com', 'test!1Example', 'amit', 'kumar');
  user2 = requestAdminAuthRegister('test.example2@gmail.com', 'test!1Example', 'amit', 'kumar');
});

describe('adminQuizList', () => {
  // Test when AuthUserId is not a valid user.
  test('authUserId is invalid', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminQuizList(invalidToken)).toStrictEqual(ERROR);
  });

  // Testing valid parameters
  test('Valid parameters with no existing quizzes', () => {
    expect(requestAdminQuizList(user.token)).toStrictEqual({ quizzes: [] });
  });

  test('Valid parameters with one existing quiz', () => {
    const quiz = requestAdminQuizCreate(user.token, 'Quiz', 'description');
    expect(requestAdminQuizList(user.token)).toStrictEqual({
      quizzes: [
        { quizId: quiz.quizId, name: 'Quiz' }
      ]
    });
  });

  test('Valid parameters with multiple existing quizzes', () => {
    // Register user and create quizzes
    const quiz1 = requestAdminQuizCreate(user.token, 'Quiz 1', 'description 1');
    const quiz2 = requestAdminQuizCreate(user.token, 'Quiz 2', 'description 2');
    // Check list of quizzes
    expect(requestAdminQuizList(user.token)).toStrictEqual({
      quizzes: [
        { quizId: quiz1.quizId, name: 'Quiz 1' },
        { quizId: quiz2.quizId, name: 'Quiz 2' }
      ]
    });
  });

  test('Multiple users with multiple quizzes', () => {
    // Register user 1 and create quizzes
    const quiz1User1 = requestAdminQuizCreate(user1.token, 'Quiz 1 User 1', 'Description 1 User 1');
    const quiz2User1 = requestAdminQuizCreate(user1.token, 'Quiz 2 User 1', 'Description 2 User 1');

    // Register user 2 and create quizzes
    const quiz1User2 = requestAdminQuizCreate(user2.token, 'Quiz 1 User 2', 'Description 1 User 2');
    const quiz2User2 = requestAdminQuizCreate(user2.token, 'Quiz 2 User 2', 'Description 2 User 2');

    // Get quizzes for user 1
    const quizzesUser1 = requestAdminQuizList(user1.token);
    expect(quizzesUser1).toStrictEqual({
      quizzes: [
        { quizId: quiz1User1.quizId, name: 'Quiz 1 User 1' },
        { quizId: quiz2User1.quizId, name: 'Quiz 2 User 1' }
      ]
    });

    // Get quizzes for user 2
    const quizzesUser2 = requestAdminQuizList(user2.token);
    expect(quizzesUser2).toStrictEqual({
      quizzes: [
        { quizId: quiz1User2.quizId, name: 'Quiz 1 User 2' },
        { quizId: quiz2User2.quizId, name: 'Quiz 2 User 2' }
      ]
    });
  });

  test('Deleted quiz is not returned in the list', () => {
    // Create a quiz
    const quiz = requestAdminQuizCreate(user.token, 'Quiz', 'description');

    // Delete the quiz
    requestAdminQuizRemove(user.token, quiz.quizId);

    // Check that the deleted quiz is not returned in the list
    expect(requestAdminQuizList(user.token)).toStrictEqual({ quizzes: [] });
  });
});
