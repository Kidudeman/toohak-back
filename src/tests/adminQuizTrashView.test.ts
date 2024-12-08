import {
  requestClear,
  requestAdminAuthRegister,
  requestAdminAuthLogout,
  requestAdminQuizCreate,
  requestAdminQuizRemove,
  requestAdminQuizTrashView
} from './requests';

const ERROR401 = { error: expect.any(String), status: 401 };

describe('requestAdminQuizTrashView - Valid token', () => {
  let user1: { token: string };
  let quiz1: { quizId: number };
  let quiz2: { quizId: number };
  let quiz3: { quizId: number };
  let quiz4: { quizId: number };

  beforeEach(() => {
    requestClear();
    user1 = requestAdminAuthRegister('test1.example@gmail.com', 'test@Exampl1e', 'test', 'example');
    quiz1 = requestAdminQuizCreate(user1.token, 'Quiz', 'Test Quiz');
    quiz2 = requestAdminQuizCreate(user1.token, 'Quiz2', 'Test Quiz2');
    quiz3 = requestAdminQuizCreate(user1.token, 'Quiz3', 'Test Quiz3');
    quiz4 = requestAdminQuizCreate(user1.token, 'Quiz4', 'Test Quiz4');
  });

  test('valid case - single', () => {
    expect(requestAdminQuizRemove(user1.token, quiz1.quizId)).toStrictEqual({});
    expect(requestAdminQuizTrashView(user1.token)).toStrictEqual({
      quizzes: [
        {
          quizId: quiz1.quizId,
          name: 'Quiz'
        }
      ]
    });
  });

  test('valid case - multiple deletions', () => {
    requestAdminQuizRemove(user1.token, quiz2.quizId);
    requestAdminQuizRemove(user1.token, quiz3.quizId);
    requestAdminQuizRemove(user1.token, quiz4.quizId);

    expect(requestAdminQuizTrashView(user1.token)).toStrictEqual({
      quizzes: [
        {
          quizId: quiz2.quizId,
          name: 'Quiz2'
        },
        {
          quizId: quiz3.quizId,
          name: 'Quiz3'
        },
        {
          quizId: quiz4.quizId,
          name: 'Quiz4'
        }
      ]
    });
  });

  test('requestAdminQuizTrashView - token invalid', () => {
    requestAdminAuthLogout(user1.token);
    expect(requestAdminQuizTrashView(user1.token)).toStrictEqual(ERROR401);
  });
});
