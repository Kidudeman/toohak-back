import { Message, QuestionBody } from '../testTypes';
import {
  requestPlayerSessionJoin, requestAdminAuthRegister, requestClear,
  requestAdminQuizCreate, requestAdminQuizSessionStart,
  requestPlayerSessionChatSend,
  requestAdminQuizSessionState,
  requestAdminQuizQuestionCreate
} from './requests';
const ERROR400 = { error: expect.any(String), status: 400 };

describe('requestPlayerChatSend', () => {
  let user: { token: string };
  let quiz: { quizId: number };
  let session: { sessionId: number };
  let player0: { playerId: number };
  let player1: { playerId: number };

  const question0Body: QuestionBody =
  {
    question: 'What is 2 + 2?',
    duration: 4,
    points: 5,
    answers: [
      {
        answer: '4',
        correct: true
      },
      {
        answer: '10 - 6',
        correct: true
      },
      {
        answer: '0',
        correct: false
      }
    ],
    thumbnailUrl: 'http://google.com/some/image/path.jpg'
  };

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister(
      'test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName'
    );
    quiz = requestAdminQuizCreate(user.token, 'Quiz', 'test');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, question0Body);
    session = requestAdminQuizSessionStart(user.token, quiz.quizId, 2);
    player0 = requestPlayerSessionJoin(session.sessionId, 'player0');
    player1 = requestPlayerSessionJoin(session.sessionId, 'player1');
    requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN'
    );
  });

  test('playerSessionChatSend valid', () => {
    const message: Message = { messageBody: 'hello' };
    expect(requestPlayerSessionChatSend(player0.playerId, message)).toEqual({});
    expect(requestPlayerSessionChatSend(player1.playerId, message)).toEqual({});
  });

  test('playerId does not exist', () => {
    const message: Message = { messageBody: 'hello' };

    expect(requestPlayerSessionChatSend(-player0.playerId, message)).toEqual(ERROR400);
  });

  test('If message body is less than 1 character', () => {
    const message: Message = { messageBody: '' };

    expect(requestPlayerSessionChatSend(player0.playerId, message)).toEqual(ERROR400);
  });

  test('If message body is more than 100 characters', () => {
    const message: Message = { messageBody: 'a'.repeat(101) };

    expect(requestPlayerSessionChatSend(player0.playerId, message)).toEqual(ERROR400);
  });
});
