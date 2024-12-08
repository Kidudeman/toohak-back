import { requestAdminAuthRegister, requestAdminQuizCreate, requestAdminQuizTransferOwner, requestClear, requestAdminQuizList } from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

describe('adminQuizTransferOwner', () => {
  let currentUser: { token: string };
  let targetUser: { token: string };
  let quiz: { quizId: number };
  let user1: { token: string };
  let user2: { token: string };
  let quiz1: { quizId: number };

  beforeEach(() => {
    requestClear();
    currentUser = requestAdminAuthRegister('current@example.com', 'password123', 'Current', 'User');
    targetUser = requestAdminAuthRegister('target@example.com', 'password456', 'Target', 'User');
    quiz = requestAdminQuizCreate(currentUser.token, 'Quiz', 'This is a quiz');
    user1 = requestAdminAuthRegister('test1@example.com', 'password1', 'John', 'Doe');
    user2 = requestAdminAuthRegister('test2@example.com', 'password2', 'Jane', 'Smith');
    quiz1 = requestAdminQuizCreate(user1.token, 'Quiz 1', 'Test Quiz 1');
  });

  test('Valid transfer of ownership', () => {
    // Create a new quiz under the current user
    const newQuiz = requestAdminQuizCreate(currentUser.token, 'New Quiz', 'This is a new quiz');

    // Perform the transfer of ownership
    const result = requestAdminQuizTransferOwner(currentUser.token, newQuiz.quizId, 'target@example.com');

    // Ensure that the transfer was successful
    expect(result).toEqual({});

    // Verify that the current user no longer owns the quiz
    const currentUserQuizzes = requestAdminQuizList(currentUser.token);
    expect(currentUserQuizzes.quizzes).not.toContainEqual(expect.objectContaining({ quizId: newQuiz.quizId }));

    // Verify that the target user now owns the quiz
    const targetUserQuizzes = requestAdminQuizList(targetUser.token);
    expect(targetUserQuizzes.quizzes).toContainEqual(expect.objectContaining({ quizId: newQuiz.quizId }));
  });

  test('Quiz ID does not refer to a valid quiz', () => {
    expect(requestAdminQuizTransferOwner(user1.token, quiz1.quizId + 1, 'test2@example.com')).toStrictEqual(ERROR403);
  });

  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const quiz2 = requestAdminQuizCreate(user2.token, 'Quiz 2', 'Test Quiz 2');
    expect(requestAdminQuizTransferOwner(user1.token, quiz2.quizId, 'test2@example.com')).toStrictEqual(ERROR403);
  });

  test('userEmail is not a real user', () => {
    expect(requestAdminQuizTransferOwner(user1.token, quiz1.quizId, 'nonexistent@example.com')).toStrictEqual(ERROR400);
  });

  test('userEmail is the current logged in user', () => {
    expect(requestAdminQuizTransferOwner(user1.token, quiz1.quizId, 'test1@example.com')).toStrictEqual(ERROR400);
  });

  test('Quiz ID refers to a quiz that has a name that is already used by the target user', () => {
    requestAdminQuizCreate(user2.token, 'Quiz 1', 'Test Quiz 1');
    expect(requestAdminQuizTransferOwner(user1.token, quiz1.quizId, 'test2@example.com')).toStrictEqual(ERROR400);
  });

  test('Token is not a valid structure', () => {
    expect(requestAdminQuizTransferOwner('invalidToken', quiz1.quizId, 'test2@example.com')).toStrictEqual(ERROR401);
  });

  test('userEmail is the current logged-in user', () => {
    expect(requestAdminQuizTransferOwner(currentUser.token, quiz.quizId, 'current@example.com')).toStrictEqual(ERROR400);
  });

  test('Quiz name is already used by the target user', () => {
    requestAdminQuizCreate(targetUser.token, 'Quiz', 'Another quiz');
    expect(requestAdminQuizTransferOwner(currentUser.token, quiz.quizId, 'target@example.com')).toStrictEqual(ERROR400);
  });

  test('Token is empty', () => {
    expect(requestAdminQuizTransferOwner('', quiz.quizId, 'target@example.com')).toStrictEqual(ERROR401);
  });

  test('Token is invalid', () => {
    expect(requestAdminQuizTransferOwner('invalidToken', quiz.quizId, 'target@example.com')).toStrictEqual(ERROR401);
  });

  test('Quiz ID is invalid', () => {
    expect(requestAdminQuizTransferOwner(currentUser.token, 999, 'target@example.com')).toStrictEqual(ERROR403);
  });

  test('User does not own the quiz', () => {
    expect(requestAdminQuizTransferOwner(targetUser.token, quiz.quizId, 'current@example.com')).toStrictEqual(ERROR403);
  });
});
