import {
  requestAdminQuizSessionStatus, requestPlayerSessionJoin,
  requestPlayerQuestionAnswer, requestAdminAuthRegister, requestClear,
  requestAdminQuizCreate, requestAdminQuizQuestionCreate,
  requestAdminQuizSessionStart, requestAdminQuizInfo,
  requestAdminQuizSessionState
} from './requests';
import { QuestionBody } from '../testTypes';

const ERROR400 = { error: expect.any(String), status: 400 };

const question0Body: QuestionBody = {
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

const question1Body: QuestionBody = {
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

describe('playerQuestionAnswer', () => {
  let user: {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  let player0: {playerId: number};
  let player1: {playerId: number};

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
    quiz = requestAdminQuizCreate(user.token, 'Quiz', 'test');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, question0Body);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, question1Body);
    session = requestAdminQuizSessionStart(user.token, quiz.quizId, 2);
    player0 = requestPlayerSessionJoin(session.sessionId, 'player0');
    player1 = requestPlayerSessionJoin(session.sessionId, 'player1');
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN');
  });

  test('playerId does not exist', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    // quiz should be on question 1 at this stage
    // -player1.playerId is invalid
    expect(requestPlayerQuestionAnswer(-player1.playerId, 1, [quizInfo.questions[0].answers[0].answerId])).toEqual(ERROR400);
    expect(requestPlayerQuestionAnswer(-player0.playerId, 1, [quizInfo.questions[0].answers[0].answerId])).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('question position is not valid for the session this player is in', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    // trying to access question 3 when the quizonly has 2 questions
    expect(requestPlayerQuestionAnswer(player1.playerId, 3, [quizInfo.questions[1].answers[0].answerId])).toEqual(ERROR400);
    expect(requestPlayerQuestionAnswer(player0.playerId, 3, [quizInfo.questions[1].answers[1].answerId])).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('session is not currently on this question', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    const quizSession = requestAdminQuizSessionStatus(user.token, quiz.quizId, session.sessionId);

    // inserting question position the session is not yet up to
    expect(requestPlayerQuestionAnswer(player1.playerId, quizSession.atQuestion + 2, [quizInfo.questions[1].answers[0].answerId])).toEqual(ERROR400);
    expect(requestPlayerQuestionAnswer(player0.playerId, quizSession.atQuestion + 2, [quizInfo.questions[1].answers[1].answerId])).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Session is not in QUESTION_OPEN state', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    // Set session state to END
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');

    expect(requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[1].answers[0].answerId])).toEqual(ERROR400);
    expect(requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[1].answers[1].answerId])).toEqual(ERROR400);
  });

  test('Invalid AnswerId(s) provided', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    expect(requestPlayerQuestionAnswer(player1.playerId, 1, [-quizInfo.questions[1].answers[0].answerId])).toEqual(ERROR400);
    expect(requestPlayerQuestionAnswer(player0.playerId, 1, [-quizInfo.questions[1].answers[1].answerId])).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Duplicate AnswerIds provided', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    expect(requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[0].answers[0].answerId, quizInfo.questions[0].answers[0].answerId])).toEqual(ERROR400);
    expect(requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[0].answers[1].answerId, quizInfo.questions[0].answers[1].answerId])).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Less than one AnswerId provided', () => {
    // const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    expect(requestPlayerQuestionAnswer(player1.playerId, 1, [])).toEqual(ERROR400);
    expect(requestPlayerQuestionAnswer(player0.playerId, 1, [])).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Test correct return', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    expect(requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[0].answers[0].answerId])).toEqual({});
    expect(requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[0].answers[1].answerId])).toEqual({});

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Test player correctly answered question', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[0].answers[1].answerId]);
    requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[0].answers[0].answerId]);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION');
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN');
    // check whether player has answered question 1

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });
});
