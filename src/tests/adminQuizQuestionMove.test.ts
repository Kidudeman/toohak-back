import {
  requestAdminAuthRegister,
  requestAdminQuizCreate, requestAdminQuizInfo, requestAdminQuizQuestionCreate,
  requestAdminQuizQuestionMove, requestClear
} from './requests';
import { QuestionBody } from '../testTypes';

const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR403 = { error: expect.any(String), status: 403 };

async function sleep(ms: number): Promise<undefined> {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

describe('adminQuizQuestionMove', () => {
  let user: { token: string };
  let quiz: { quizId: number };
  let question1: { questionId: number };
  let question2: { questionId: number };

  const question1Body: QuestionBody =
  {
    question: 'Who is the Monarch of England?',
    duration: 4,
    thumbnailUrl: 'http://google.com/some/image/path.png',
    points: 5,
    answers: [
      {
        answer: 'Prince Charles',
        correct: true
      },
      {
        answer: 'Boris Johnson',
        correct: false
      }
    ]
  };

  const question2Body: QuestionBody =
  {
    question: 'What is 1 + 1?',
    duration: 4,
    thumbnailUrl: 'http://google.com/some/image/path.jpg',
    points: 5,
    answers: [
      {
        answer: '2',
        correct: true
      },
      {
        answer: '21',
        correct: false
      }
    ]
  };

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('test1.example@gmail.com', 'test@Exampl1e', 'test', 'example');
    quiz = requestAdminQuizCreate(user.token, 'Quiz', 'Test Quiz');
    question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, question1Body);
    question2 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, question2Body);
  });

  test('adminQuizQuestionMove is valid: moving question backward', async () => {
    const timeLastEdited = requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited;
    await sleep(1000);
    expect(requestAdminQuizQuestionMove(user.token, quiz.quizId, question1.questionId, 1)).toStrictEqual({});

    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    expect(quizInfo).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Test Quiz',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'What is 1 + 1?',
          duration: 4,
          thumbnailUrl: 'http://google.com/some/image/path.jpg',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: '2',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: '21',
              colour: expect.any(String),
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'Who is the Monarch of England?',
          duration: 4,
          thumbnailUrl: 'http://google.com/some/image/path.png',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Boris Johnson',
              colour: expect.any(String),
              correct: false
            }
          ]
        }
      ],
      duration: 8,
      thumbnailUrl: ''
    });

    // testing if the timeLastEdited is updated
    expect(quizInfo.timeLastEdited - timeLastEdited >= 1).toStrictEqual(true);
  });

  test('adminQuizQuestionMove is valid: moving question forward', () => {
    expect(requestAdminQuizQuestionMove(user.token, quiz.quizId, question2.questionId, 0)).toStrictEqual({});
    expect(requestAdminQuizInfo(user.token, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Test Quiz',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'What is 1 + 1?',
          duration: 4,
          thumbnailUrl: 'http://google.com/some/image/path.jpg',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: '2',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: '21',
              colour: expect.any(String),
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'Who is the Monarch of England?',
          duration: 4,
          thumbnailUrl: 'http://google.com/some/image/path.png',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Boris Johnson',
              colour: expect.any(String),
              correct: false
            }
          ]
        }
      ],
      duration: 8,
      thumbnailUrl: ''
    });
  });

  test('questionId is invalid', () => {
    expect(requestAdminQuizQuestionMove(user.token, quiz.quizId, -question1.questionId, 1)).toStrictEqual(ERROR400);
  });

  test.each([
    { test: 'newPosition is less than 0', newPosition: -1 },
    { test: 'newPosition is greater than n-1 where n is the number of questions', newPosition: 5 },
    { test: 'newPosition is the position of the current question', newPosition: 0 },

  ])('invalid newPosition', ({ newPosition }) => {
    expect(requestAdminQuizQuestionMove(user.token, quiz.quizId, question1.questionId, newPosition)).toStrictEqual(ERROR400);
  });

  test('token is invalid', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminQuizQuestionMove(invalidToken, quiz.quizId, question1.questionId, 1)).toStrictEqual(ERROR401);
  });

  test('The quiz ID is invalid', () => {
    expect(requestAdminQuizQuestionMove(user.token, quiz.quizId - 1, question1.questionId, 1)).toStrictEqual(ERROR403);
  });

  test('user does not own the quiz', () => {
    const notQuizOwner = requestAdminAuthRegister('test2.example2@gmail.com', 'Test@Example2', 'andrew', 'examplee');
    expect(requestAdminQuizQuestionMove(notQuizOwner.token, quiz.quizId, question1.questionId, 1)).toStrictEqual(ERROR403);
  });
});
