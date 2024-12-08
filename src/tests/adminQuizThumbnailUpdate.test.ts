import {
  requestAdminQuizQuestionCreate,
  requestAdminAuthRegister,
  requestAdminQuizCreate,
  requestClear,
  requestAdminQuizInfo,
  requestAdminQuizThumbnailUpdate,
} from './requests';
import { QuestionBody } from '../testTypes';

const TOKEN_ERROR = { error: expect.any(String), status: 401 };
const QUIZ_ERROR = { error: expect.any(String), status: 403 };
const QUESTION_ERROR = { error: expect.any(String), status: 400 };

let user: { token: string };
let anotherUser: { token: string };
let quiz: { quizId: number };
let question1: { questionId: number };

describe('adminQuizQuestionUpdate - user errors', () => {
  const question1Body: QuestionBody = {
    question: 'Is the sky blue?',
    duration: 4,
    points: 5,
    answers: [{
      answer: 'Yes',
      correct: true
    },
    {
      answer: 'No',
      correct: false
    }],
    thumbnailUrl: 'http://google.com/some/image/path.jpg',
  };

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('test@gmail.com', 'GoodPassword1', 'First', 'Last');
    anotherUser = requestAdminAuthRegister('pierre@gmail.com', 'PassWord123', 'Pierre', 'Nguyen');
    quiz = requestAdminQuizCreate(user.token, 'FunQuiz', 'A quiz to make tests');
    question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, question1Body);
  });

  // Invalid token error401
  test('Token is invalid.', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminQuizThumbnailUpdate(invalidToken, quiz.quizId, 'http://google.com/some/image/path.png')).toStrictEqual(TOKEN_ERROR);
  });

  // User does not own quiz error403
  test('User does not own quiz.', () => {
    expect(requestAdminQuizThumbnailUpdate(anotherUser.token, quiz.quizId, 'http://google.com/some/image/path.png')).toStrictEqual(QUIZ_ERROR);
  });

  describe('imgURL error - formats', () => {
    // The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png
    test('The thumbnailUrl does not end with jpg, jpeg, png', () => {
      expect(requestAdminQuizThumbnailUpdate(user.token, quiz.quizId, 'http://google.com/some/image/path.pdf')).toStrictEqual(QUESTION_ERROR);
    });

    // The thumbnailUrl does not begin with 'http://' or 'https://'
    test('The thumbnailUrl does not begin with http:// or https://', () => {
      expect(requestAdminQuizThumbnailUpdate(user.token, quiz.quizId, 'http:/google.com/some/image/path.jpg')).toStrictEqual(QUESTION_ERROR);
      expect(requestAdminQuizThumbnailUpdate(user.token, quiz.quizId, 'www.google.com/some/image/path.jpg')).toStrictEqual(QUESTION_ERROR);
    });

    // Successfull update thumbnail
    test('test correct return.', () => {
      requestAdminQuizThumbnailUpdate(user.token, quiz.quizId, 'http://google.com/newthumbnail/update/path.jpeg');
      const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
      expect(quizInfo.questions[0]).toMatchObject({
        questionId: question1.questionId,
        question: question1Body.question,
        duration: question1Body.duration,
        points: question1Body.points
      });

      const currentTime = Math.floor(Date.now() / 1000);
      expect(quizInfo.timeLastEdited).toEqual(currentTime);
      expect(quizInfo.thumbnailUrl).toEqual('http://google.com/newthumbnail/update/path.jpeg');
    });
  });
});
