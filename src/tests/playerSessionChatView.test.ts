import { Message, QuestionBody } from '../testTypes';
import {
  requestPlayerSessionJoin, requestAdminAuthRegister, requestClear,
  requestAdminQuizCreate, requestAdminQuizSessionStart, requestPlayerSessionChatView,
  requestPlayerSessionChatSend,
  requestAdminQuizQuestionCreate,
  requestAdminQuizSessionState
} from './requests';
const ERROR400 = { error: expect.any(String), status: 400 };

describe('requestPlayerChatView', () => {
  let user: {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  let player0: {playerId: number};
  let player1: {playerId: number};

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

  test('playerSessionChatView valid - no messages', () => {
    expect(requestPlayerSessionChatView(player0.playerId)).toEqual({ messages: [] });
  });

  test('playerSessionChatView valid', () => {
    const message: Message = { messageBody: 'Hello' };
    expect(requestPlayerSessionChatSend(player0.playerId, message)).toEqual({});
    expect(requestPlayerSessionChatSend(player1.playerId, message)).toEqual({});
    expect(requestPlayerSessionChatView(player0.playerId)).toEqual({
      messages: [
        {
          messageBody: 'Hello',
          playerId: player0.playerId,
          playerName: 'player0',
          timeSent: expect.any(Number)
        },
        {
          messageBody: 'Hello',
          playerId: player1.playerId,
          playerName: 'player1',
          timeSent: expect.any(Number)
        }
      ]
    });
  });

  test('playerId does not exist', () => {
    expect(requestPlayerSessionChatView(-player0.playerId)).toEqual(ERROR400);
  });
});
