import {
  requestPlayerSessionJoin, requestAdminAuthRegister, requestClear,
  requestAdminQuizCreate, requestAdminQuizSessionStart,
  requestAdminQuizQuestionCreate,
  requestPlayerSessionChatView,
  requestPlayerSessionChatSend,
} from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
import { QuestionBody, Message } from '../testTypes';

let user1: { token: string };
let quiz1: { quizId: number };
let session1: { sessionId: number };
let player1: { playerId: number };

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
      answer: '21',
      correct: false
    },
    {
      answer: '0',
      correct: false
    }
  ],
  thumbnailUrl: 'http://google.com/some/image/path.jpg'
};

describe('playerSessionJoin', () => {
  beforeEach(() => {
    requestClear();
    user1 = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
    quiz1 = requestAdminQuizCreate(user1.token, 'Quiz', 'test');
    requestAdminQuizQuestionCreate(user1.token, quiz1.quizId, question0Body);
    session1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 3);
  });

  describe('playerSessionJoin - Valid Tests', () => {
    test('valid name - non-empty string', () => {
      expect(requestPlayerSessionJoin(session1.sessionId, 'Pierre')).toStrictEqual({ playerId: expect.any(Number) });
    });

    test('valid name - empty name succesfully generates name', () => {
      player1 = requestPlayerSessionJoin(session1.sessionId, '');
      expect(player1).toStrictEqual({ playerId: expect.any(Number) });
      const message: Message = { messageBody: 'hello' };
      // check if name conforms to the structure "[5 letters][3 numbers]"
      requestPlayerSessionChatSend(player1.playerId, message);
      const playerName = requestPlayerSessionChatView(player1.playerId).messages[0].playerName;
      const nameRegex = /^[a-zA-Z]{5}\d{3}$/;
      expect(playerName).toMatch(nameRegex);
    });
  });

  describe('playerSessionJoin - Invalid Tests (Throws Error)', () => {
    test('Session Id does not refer to a valid session', () => {
      expect(requestPlayerSessionJoin(session1.sessionId + 1, 'Queensly')).toStrictEqual(ERROR400);
    });

    test('Session is not in LOBBY state', () => {
      requestClear();
      user1 = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
      quiz1 = requestAdminQuizCreate(user1.token, 'Quiz', 'test');
      requestAdminQuizQuestionCreate(user1.token, quiz1.quizId, question0Body);
      session1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 2);
      requestPlayerSessionJoin(session1.sessionId, 'Laura');
      requestPlayerSessionJoin(session1.sessionId, 'Pierre');

      expect(requestPlayerSessionJoin(session1.sessionId, 'Andrew')).toStrictEqual(ERROR400);
    });

    test('Name is not unique to session', () => {
      requestPlayerSessionJoin(session1.sessionId, 'Dennis');
      expect(requestPlayerSessionJoin(session1.sessionId, 'Dennis')).toStrictEqual(ERROR400);
    });
  });
});
