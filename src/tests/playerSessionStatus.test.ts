import {
  requestPlayerSessionJoin, requestAdminAuthRegister, requestClear,
  requestAdminQuizCreate, requestAdminQuizSessionStart,
  requestAdminQuizQuestionCreate, requestPlayerSessionStatus,
  requestAdminQuizSessionState
} from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
import { QuestionBody } from '../testTypes';
import { QuizState } from '../types';

let user1: { token: string };
let quiz1: { quizId: number };
let session1: { sessionId: number };
let player1: { playerId: number };
let player0: { playerId: number };

const question0Body: QuestionBody =
{
  question: 'What is 1 + 1?',
  duration: 4,
  points: 5,
  answers: [
    {
      answer: '2',
      correct: true
    },
    {
      answer: '5',
      correct: false
    },
    {
      answer: '0',
      correct: false
    }
  ],
  thumbnailUrl: 'http://google.com/some/image/path.jpg'
};

const question1Body: QuestionBody =
{
  question: 'Is water wet?',
  duration: 5,
  points: 5,
  answers: [
    {
      answer: 'yes',
      correct: true
    },
    {
      answer: 'no',
      correct: false
    },
    {
      answer: 'both',
      correct: false
    }
  ],
  thumbnailUrl: 'http://yahoo.com/another/image/path.jpg'
};

describe('playerSessionStatus', () => {
  beforeEach(() => {
    requestClear();
    user1 = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
    quiz1 = requestAdminQuizCreate(user1.token, 'Quiz', 'test');
    requestAdminQuizQuestionCreate(user1.token, quiz1.quizId, question0Body);
    session1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 2);
    player0 = requestPlayerSessionJoin(session1.sessionId, 'Laura');
  });

  describe('playerSessionStatus - Valid Tests', () => {
    test('first question', () => {
      requestAdminQuizQuestionCreate(user1.token, quiz1.quizId, question1Body);
      player1 = requestPlayerSessionJoin(session1.sessionId, 'Pierre');
      requestAdminQuizSessionState(user1.token, quiz1.quizId, session1.sessionId, 'SKIP_COUNTDOWN');
      expect(requestPlayerSessionStatus(player1.playerId)).toEqual(
        {
          state: QuizState.QUESTION_OPEN,
          numQuestions: 2,
          atQuestion: 0,
        }
      );

      requestAdminQuizSessionState(user1.token, quiz1.quizId, session1.sessionId, 'END');
    });

    test('no score, in lobby', () => {
      requestAdminQuizQuestionCreate(user1.token, quiz1.quizId, question1Body);
      expect(requestPlayerSessionStatus(player0.playerId)).toEqual(
        {
          state: QuizState.LOBBY,
          numQuestions: 2,
          atQuestion: -1,
        }
      );
      requestAdminQuizSessionState(user1.token, quiz1.quizId, session1.sessionId, 'END');
    });
  });

  describe('playerSessionStatus - Failed Tests', () => {
    test('unsuccessful - player ID does not exist', () => {
      expect(requestPlayerSessionStatus(-player0.playerId)).toStrictEqual(ERROR400);
    });
  });
});
