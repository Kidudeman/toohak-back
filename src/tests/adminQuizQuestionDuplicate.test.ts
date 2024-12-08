import {
  requestAdminAuthRegister,
  requestAdminQuizCreate, requestAdminQuizInfo, requestAdminQuizQuestionCreate,
  requestAdminQuizQuestionDuplicate, requestClear
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

describe('adminQuizQuestionDuplicate', () => {
  let user: { token: string };
  let quiz: { quizId: number };
  let question: { questionId: number };

  const questionBody: QuestionBody =
  {
    question: 'What is 1 + 1?',
    duration: 61,
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
    ],
    thumbnailUrl: 'http://google.com/some/image/path.jpg'
  };

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('test1.example@gmail.com', 'test@Exampl1e', 'test', 'example');
    quiz = requestAdminQuizCreate(user.token, 'Quiz', 'Test Quiz');
    question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
  });

  test('adminQuizQuestionDuplicate is valid', async () => {
    const timeLastEdited = requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited;
    await sleep(1000);

    expect(requestAdminQuizQuestionDuplicate(user.token, quiz.quizId, question.questionId)).toStrictEqual({ newQuestionId: expect.any(Number) });
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    expect(quizInfo).toStrictEqual({
      quizId: expect.any(Number),
      name: 'Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Test Quiz',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'What is 1 + 1?',
          duration: 61,
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
          question: 'What is 1 + 1?',
          duration: 61,
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
        }
      ],
      duration: 122,
      thumbnailUrl: '',
    });

    expect(quizInfo.timeLastEdited - timeLastEdited >= 1).toStrictEqual(true);
  });

  test('QuestionId is invalid', () => {
    expect(requestAdminQuizQuestionDuplicate(user.token, quiz.quizId, -question.questionId)).toStrictEqual(ERROR400);
  });

  test('token is invalid', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminQuizQuestionDuplicate(invalidToken, quiz.quizId, question.questionId)).toStrictEqual(ERROR401);
  });

  test('The quiz ID is invalid', () => {
    expect(requestAdminQuizQuestionDuplicate(user.token, quiz.quizId - 1, question.questionId)).toStrictEqual(ERROR403);
  });

  test('user does not own the quiz', () => {
    const notQuizOwner = requestAdminAuthRegister('test2.example2@gmail.com', 'Test@Example2', 'andrew', 'examplee');
    expect(requestAdminQuizQuestionDuplicate(notQuizOwner.token, quiz.quizId, question.questionId)).toStrictEqual(ERROR403);
  });

  test('duplicate makes quiz more than 3 minutes', () => {
    expect(requestAdminQuizQuestionDuplicate(user.token, quiz.quizId, question.questionId)).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(requestAdminQuizQuestionDuplicate(user.token, quiz.quizId, question.questionId)).toStrictEqual(ERROR400);
  });
});
