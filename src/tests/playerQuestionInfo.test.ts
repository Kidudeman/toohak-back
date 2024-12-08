import {
  requestPlayerQuestionInfo, requestPlayerSessionJoin,
  requestAdminAuthRegister, requestClear,
  requestAdminQuizCreate, requestAdminQuizQuestionCreate,
  requestAdminQuizSessionStart, requestAdminQuizInfo,
  requestAdminQuizSessionState,
  requestAdminQuizSessionStatus
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

describe('playerQuestionInfo error tests', () => {
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
    // quiz should be on question 1 at this stage
    // -player1.playerId is invalid
    expect(requestPlayerQuestionInfo(-player1.playerId, 1)).toEqual(ERROR400);
    expect(requestPlayerQuestionInfo(-player0.playerId, 1)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('question position is not valid for the session this player is in', () => {
    // trying to access question 3, when quiz only has 2 questions
    expect(requestPlayerQuestionInfo(player1.playerId, 3)).toEqual(ERROR400);
    expect(requestPlayerQuestionInfo(player0.playerId, 3)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('session is not currently on this question', () => {
    const quizSession = requestAdminQuizSessionStatus(user.token, quiz.quizId, session.sessionId);

    // inserting question position the session is not yet up to
    expect(requestPlayerQuestionInfo(player1.playerId, quizSession.atQuestion + 2)).toEqual(ERROR400);
    expect(requestPlayerQuestionInfo(player0.playerId, quizSession.atQuestion + 2)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Session is in QUESTION_COUNTDOWN state', () => {
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION');

    expect(requestPlayerQuestionInfo(player1.playerId, 1)).toEqual(ERROR400);
    expect(requestPlayerQuestionInfo(player0.playerId, 1)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Session is in END state', () => {
    // Set session state to END
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');

    // -player1.playerId is invalid
    expect(requestPlayerQuestionInfo(player1.playerId, 1)).toEqual(ERROR400);
    expect(requestPlayerQuestionInfo(player0.playerId, 1)).toEqual(ERROR400);
  });

  test('Correct return', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    // quiz should be started, so first question should be shown
    const expectedInfo = {
      questionId: quizInfo.questions[0].questionId,
      question: quizInfo.questions[0].question,
      duration: quizInfo.questions[0].duration,
      thumbnailUrl: quizInfo.questions[0].thumbnailUrl,
      points: quizInfo.questions[0].points,
      answers: [
        {
          answer: quizInfo.questions[0].answers[0].answer,
          answerId: quizInfo.questions[0].answers[0].answerId,
          colour: quizInfo.questions[0].answers[0].colour
        },
        {
          answer: quizInfo.questions[0].answers[1].answer,
          answerId: quizInfo.questions[0].answers[1].answerId,
          colour: quizInfo.questions[0].answers[1].colour
        },
        {
          answer: quizInfo.questions[0].answers[2].answer,
          answerId: quizInfo.questions[0].answers[2].answerId,
          colour: quizInfo.questions[0].answers[2].colour
        }
      ]
    };
    expect(requestPlayerQuestionInfo(player1.playerId, 1)).toEqual(expectedInfo);
    expect(requestPlayerQuestionInfo(player0.playerId, 1)).toEqual(expectedInfo);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });
});

describe('playerQuestionInfo in wrong state', () => {
  let user: {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  let player0: {playerId: number};

  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
    quiz = requestAdminQuizCreate(user.token, 'Quiz', 'test');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, question0Body);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, question1Body);
    session = requestAdminQuizSessionStart(user.token, quiz.quizId, 2);
    player0 = requestPlayerSessionJoin(session.sessionId, 'player0');
  });

  test('Session is in LOBBY state', () => {
    expect(requestPlayerQuestionInfo(player0.playerId, 1)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });
});
