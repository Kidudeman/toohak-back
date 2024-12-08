import {
  requestAdminQuizQuestionCreate,
  requestAdminQuizQuestionUpdate,
  requestAdminAuthRegister,
  requestAdminQuizCreate,
  requestClear,
  requestAdminQuizInfo
} from './requests';
import { QuestionBody } from '../testTypes';

const TOKEN_ERROR = { error: expect.any(String), status: 401 };
const QUIZ_ERROR = { error: expect.any(String), status: 403 };
const QUESTION_ERROR = { error: expect.any(String), status: 400 };

describe('adminQuizQuestionUpdate', () => {
  let user: { token: string };
  let user1: { token: string };
  let quiz: { quizId: number };
  let question1: { questionId: number };

  const question1Body: QuestionBody = {
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
    thumbnailUrl: 'http://google.com/some/image/path.jpg',
  };

  const question2Body: QuestionBody = {
    question: 'What is 1 + 1?',
    duration: 10,
    points: 5,
    answers: [{
      answer: '3',
      correct: false
    },
    {
      answer: '2',
      correct: true
    }],
    thumbnailUrl: 'http://google.com/some/image/path.png',
  };

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('tom@gmail.com', 'Password111', 'Tom', 'Smith');
    user1 = requestAdminAuthRegister('max@gmail.com', 'Password222', 'Max', 'Lopez');
    quiz = requestAdminQuizCreate(user.token, 'FunQuiz', 'A quiz to make tests');
    question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, question1Body);
  });

  // Invalid token
  test('Token is invalid.', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminQuizQuestionUpdate(invalidToken, quiz.quizId, question1.questionId, question1Body)).toStrictEqual(TOKEN_ERROR);
  });

  // Invalid quizId
  test('quizId does not refer to a valid quiz.', () => {
    expect(requestAdminQuizQuestionUpdate(user.token, -quiz.quizId, question1.questionId, question1Body)).toStrictEqual(QUIZ_ERROR);
  });

  // User does not own quiz
  test('User does not own quiz.', () => {
    expect(requestAdminQuizQuestionUpdate(user1.token, quiz.quizId, question1.questionId, question1Body)).toStrictEqual(QUIZ_ERROR);
  });

  // invalid questionId
  test('questionId does not refer to a valid question.', () => {
    expect(requestAdminQuizQuestionUpdate(user.token, quiz.quizId, -question1.questionId, question1Body)).toStrictEqual(QUESTION_ERROR);
  });

  // question string is too short
  test('question string is too short.', () => {
    expect(requestAdminQuizQuestionUpdate(user.token, quiz.quizId, question1.questionId, { question: 'smol', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, thumbnailUrl: 'http://google.com/some/image/path.jpg', points: 5 })).toStrictEqual(QUESTION_ERROR);
  });

  // question string is too long
  test('question string is too long.', () => {
    expect(requestAdminQuizQuestionUpdate(user.token, quiz.quizId, question1.questionId, { question: 'long'.repeat(20), answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, thumbnailUrl: 'http://google.com/some/image/path.jpg', points: 5 })).toStrictEqual(QUESTION_ERROR);
  });

  // question has more than 6 answers
  test('Too many answers.', () => {
    expect(requestAdminQuizQuestionUpdate(user.token, quiz.quizId, question1.questionId, { question: 'Question', answers: Array(7).fill({ answer: 'Answer', correct: true }), thumbnailUrl: 'http://google.com/some/image/path.jpg', duration: 60, points: 5 })).toStrictEqual(QUESTION_ERROR);
  });

  // question has less than 2 answers
  test('Not enough answers.', () => {
    expect(requestAdminQuizQuestionUpdate(user.token, quiz.quizId, question1.questionId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }], duration: 60, thumbnailUrl: 'http://google.com/some/image/path.jpg', points: 5 })).toStrictEqual(QUESTION_ERROR);
  });

  // question duration is not a positive number
  test('Question duration is not a positive number.', () => {
    expect(requestAdminQuizQuestionUpdate(user.token, quiz.quizId, question1.questionId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 0, thumbnailUrl: 'http://google.com/some/image/path.jpg', points: 5 })).toStrictEqual(QUESTION_ERROR);
    expect(requestAdminQuizQuestionUpdate(user.token, quiz.quizId, question1.questionId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: -10, thumbnailUrl: 'http://google.com/some/image/path.jpg', points: 5 })).toStrictEqual(QUESTION_ERROR);
  });

  // If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes
  test('Duration of quiz too long with this update.', () => {
    expect(requestAdminQuizQuestionUpdate(user.token, quiz.quizId, question1.questionId, { question: 'Question 2', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 181, thumbnailUrl: 'http://google.com/some/image/path.jpg', points: 5 })).toStrictEqual(QUESTION_ERROR);
  });

  // not enough points for this question
  test('not enough points for this question, need at least 1.', () => {
    expect(requestAdminQuizQuestionUpdate(
      user.token, quiz.quizId, question1.questionId,
      {
        question: 'Question',
        answers: [
          { answer: 'Answer 1', correct: true },
          { answer: 'Answer 2', correct: false }
        ],
        duration: 60,
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
        points: 0
      }
    )).toStrictEqual(QUESTION_ERROR);
  });

  // Too many points for this question
  test('Too many points for this question, cannot be more than 10.', () => {
    expect(requestAdminQuizQuestionUpdate(
      user.token, quiz.quizId, question1.questionId,
      {
        question: 'Question',
        answers: [
          { answer: 'Answer 1', correct: true },
          { answer: 'Answer 2', correct: false }
        ],
        duration: 60,
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
        points: 11
      }
    )).toStrictEqual(QUESTION_ERROR);
  });

  // answer too short
  test('Answer must me at least 1 character long.', () => {
    expect(requestAdminQuizQuestionUpdate(
      user.token, quiz.quizId, question1.questionId,
      {
        question: 'Question',
        answers: [
          { answer: '', correct: true },
          { answer: 'Answer 2', correct: false }
        ],
        duration: 60,
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
        points: 5
      }
    )).toStrictEqual(QUESTION_ERROR);
  });

  // answer too long
  test('Answer must be less than 30 characters long.', () => {
    expect(requestAdminQuizQuestionUpdate(
      user.token, quiz.quizId, question1.questionId,
      {
        question: 'Question',
        answers: [
          { answer: 'Answer 1', correct: true },
          { answer: 'A'.repeat(31), correct: false }
        ],
        duration: 60,
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
        points: 5
      }
    )).toStrictEqual(QUESTION_ERROR);
  });

  // Duplicate answers
  test('Multiple of the same answer.', () => {
    expect(requestAdminQuizQuestionUpdate(
      user.token, quiz.quizId,
      question1.questionId,
      {
        question: 'Question',
        answers: [
          { answer: 'Answer', correct: true },
          { answer: 'Answer', correct: false }
        ],
        duration: 60,
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
        points: 5
      }
    )).toStrictEqual(QUESTION_ERROR);
  });

  // No correct answers
  test('No correct answers.', () => {
    expect(
      requestAdminQuizQuestionUpdate(
        user.token, quiz.quizId, question1.questionId,
        {
          question: 'Question',
          answers: [
            { answer: 'Answer 1', correct: false },
            { answer: 'Answer 2', correct: false }
          ],
          duration: 60,
          thumbnailUrl: 'http://google.com/some/image/path.jpg',
          points: 5
        }
      )
    ).toStrictEqual(QUESTION_ERROR);
  });

  // test correct return
  test('test correct return.', () => {
    expect(
      requestAdminQuizQuestionUpdate(
        user.token, quiz.quizId,
        question1.questionId,
        {
          question: 'Question',
          answers: [
            { answer: 'Answer 1', correct: true },
            { answer: 'Answer 2', correct: false }
          ],
          duration: 60,
          thumbnailUrl: 'http://google.com/some/image/path.jpg',
          points: 5
        }
      )
    ).toStrictEqual({});
  });

  // The thumbnailUrl is an empty string
  test('The thumbnailUrl is an empty string', () => {
    expect(
      requestAdminQuizQuestionUpdate(
        user.token, quiz.quizId,
        question1.questionId,
        {
          question: 'Question',
          answers: [
            { answer: 'Answer 1', correct: true },
            { answer: 'Answer 2', correct: false }
          ],
          duration: 60,
          points: 5,
          thumbnailUrl: ''
        }
      )
    ).toStrictEqual(QUESTION_ERROR);
  });

  // The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png
  test('The thumbnailUrl does not end with jpg, jpeg, png', () => {
    expect(
      requestAdminQuizQuestionUpdate(
        user.token, quiz.quizId,
        question1.questionId,
        {
          question: 'Question',
          answers: [
            { answer: 'Answer 1', correct: true },
            { answer: 'Answer 2', correct: false }
          ],
          duration: 60,
          points: 5,
          thumbnailUrl: 'http://google.com/some/image/path.asd'
        }
      )
    ).toStrictEqual(QUESTION_ERROR);
  });

  // The thumbnailUrl does not begin with 'http://' or 'https://'
  test('The thumbnailUrl does not begin with http:// or https://', () => {
    expect(
      requestAdminQuizQuestionUpdate(
        user.token, quiz.quizId,
        question1.questionId,
        {
          question: 'Question',
          answers: [
            { answer: 'Answer 1', correct: true },
            { answer: 'Answer 2', correct: false }
          ],
          duration: 60,
          points: 5,
          thumbnailUrl: 'htt:/google.com/some/image/path.jpg'
        }
      )
    ).toStrictEqual(QUESTION_ERROR);
  });

  // test correctly updated question
  test('test correct return.', () => {
    requestAdminQuizQuestionUpdate(user.token, quiz.quizId, question1.questionId, question2Body);
    const currentTime = Math.floor(Date.now() / 1000);
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    expect(quizInfo.questions[0]).toMatchObject({
      questionId: question1.questionId,
      question: question2Body.question,
      duration: question2Body.duration,
      points: question2Body.points
    });
    expect(quizInfo.questions[0].answers).toHaveLength(2);
    expect(quizInfo.questions[0].answers[0].answer).toEqual('3');
    expect(quizInfo.questions[0].answers[0].correct).toEqual(false);
    expect(quizInfo.questions[0].answers[1].answer).toEqual('2');
    expect(quizInfo.questions[0].answers[1].correct).toEqual(true);
    expect(quizInfo.timeLastEdited).toEqual(currentTime);
    expect(quizInfo.questions[0].thumbnailUrl).toEqual('http://google.com/some/image/path.png');
  });
});
