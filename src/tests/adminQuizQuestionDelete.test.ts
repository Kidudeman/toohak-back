import {
  requestAdminQuizQuestionCreate,
  requestAdminQuizQuestionDelete,
  requestAdminAuthRegister,
  requestAdminQuizCreate,
  requestClear,
  requestAdminQuizInfo
} from './requests';
import { QuestionBody } from '../testTypes';

const TOKEN_ERROR = { error: expect.any(String), status: 401 };
const QUIZ_ERROR = { error: expect.any(String), status: 403 };
const QUESTION_ERROR = { error: expect.any(String), status: 400 };

describe('adminQuizQuestionDelete', () => {
  let user: {token: string};
  let user1: {token: string};
  let quiz: {quizId: number};
  let question: {questionId: number};

  const questionBody: QuestionBody = {
    question: 'Who is the Monarch of England?',
    duration: 4,
    points: 5,
    answers: [{
      answer: 'Prince Charles',
      correct: true
    },
    {
      answer: 'Boris Johnson',
      correct: false
    }],
    thumbnailUrl: 'http://google.com/some/image/path.jpg'
  };

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('tom@gmail.com', 'Password111', 'Tom', 'Smith');
    user1 = requestAdminAuthRegister('max@gmail.com', 'Password222', 'Max', 'Lopez');
    quiz = requestAdminQuizCreate(user.token, 'FunQuiz', 'A quiz to make tests');
    question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
  });

  // invalid token
  test('Token is invalid.', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminQuizQuestionDelete(invalidToken, quiz.quizId, question.questionId)).toStrictEqual(TOKEN_ERROR);
  });

  // invalid quizId
  test('quizId does not refer to a valid quiz.', () => {
    expect(requestAdminQuizQuestionDelete(user.token, -quiz.quizId, question.questionId)).toStrictEqual(QUIZ_ERROR);
  });

  // quiz not owned by user
  test('current user does not own this quiz.', () => {
    expect(requestAdminQuizQuestionDelete(user1.token, quiz.quizId, question.questionId)).toStrictEqual(QUIZ_ERROR);
  });

  // invalid questionId
  test('questionId does not refer to a valid question.', () => {
    expect(requestAdminQuizQuestionDelete(user.token, quiz.quizId, -question.questionId)).toStrictEqual(QUESTION_ERROR);
  });

  // // session for this quiz is not in END state ??
  // test('session for this quiz is not in END state.', () => {
  //     expect(requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId)).toStrictEqual(QUESTION_ERROR);
  // });

  // test correct output
  test('test correct output.', () => {
    expect(requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId)).toStrictEqual({});
  });

  // test correctly deleted question
  test('test question correctly deleted.', () => {
    requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId);
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    expect(quizInfo.questions.length).toEqual(0);
  });

  // test time last edited correctly updated
  test('test time last edited correctly updated.', () => {
    requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId);
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const currentTime = Math.floor(Date.now() / 1000);
    expect(quizInfo.timeLastEdited).toEqual(currentTime);
  });
});
