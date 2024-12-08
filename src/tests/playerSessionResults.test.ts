import {
  requestPlayerSessionResults, requestPlayerSessionJoin,
  requestPlayerQuestionAnswer, requestAdminAuthRegister, requestClear,
  requestAdminQuizCreate, requestAdminQuizQuestionCreate,
  requestAdminQuizSessionStart, requestAdminQuizInfo,
  requestAdminQuizSessionState
} from './requests';
import { QuestionBody } from '../testTypes';
const ERROR400 = { error: expect.any(String), status: 400 };

async function sleep(ms: number): Promise<undefined> {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

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

const question1Body: QuestionBody =
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

let user: {token: string};
let quiz: {quizId: number};
let session: {sessionId: number};
let question0: {questionId: number};
let question1: {questionId: number};
let player0: {playerId: number};
let player1: {playerId: number};

describe('requestPlayerSessionResults is valid', () => {
  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister(
      'test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName'
    );
    quiz = requestAdminQuizCreate(user.token, 'Quiz', 'test');
    question0 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, question0Body);
    question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, question1Body);
    session = requestAdminQuizSessionStart(user.token, quiz.quizId, 2);
    player0 = requestPlayerSessionJoin(session.sessionId, 'player0');
    player1 = requestPlayerSessionJoin(session.sessionId, 'player1');
    requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN'
    );
  });

  test('one player correct one player incorrect - no scaling factor', () => {
    requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN'
    );

    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    // Both players answer question0, player 0 is correct, player 1 is incorrect
    expect(requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[0].answers[0].answerId])).toStrictEqual({});
    expect(requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[0].answers[1].answerId])).toStrictEqual({});

    // Set session to NEXT_QUESTION
    expect(requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER'
    )).toStrictEqual({});
    expect(requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION'
    )).toStrictEqual({});
    expect(requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN'
    )).toStrictEqual({});

    // Both players answer question1, player 0 is correct, player 1 is incorrect
    expect(requestPlayerQuestionAnswer(
      player0.playerId,
      2,
      [
        quizInfo.questions[1].answers[0].answerId,
        quizInfo.questions[1].answers[1].answerId,
      ]
    )).toStrictEqual({});

    expect(requestPlayerQuestionAnswer(
      player1.playerId,
      2,
      [
        quizInfo.questions[1].answers[2].answerId,
      ]
    )).toStrictEqual({});

    const expectedSessionResults = {
      usersRankedByScore: [
        {
          name: 'player0',
          score: 10
        },
        {
          name: 'player1',
          score: 0
        }
      ],
      questionResults: [
        {
          questionId: question0.questionId,
          playersCorrectList: [
            'player0'
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50
        },
        {
          questionId: question1.questionId,
          playersCorrectList: [
            'player0'
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50
        },
      ]
    };

    // Set the state to GO_TO_FINAL_RESULTS
    expect(requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER'
    )).toStrictEqual({});
    expect(requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS'
    )).toStrictEqual({});

    expect(requestPlayerSessionResults(player1.playerId)).toEqual(expectedSessionResults);
    expect(requestPlayerSessionResults(player0.playerId)).toEqual(expectedSessionResults);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Testing if scaling factor is correctly applied', async () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    // player 0 is correct,
    requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[0].answers[0].answerId]);

    // Loop until time is different
    await sleep(500);

    // player 1 is correct
    requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[0].answers[0].answerId]);

    // Set session to NEXT_QUESTION
    requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER'
    );

    requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION'
    );
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN');

    // Both players answer question1, player 0 is correct, player 1 is correct
    requestPlayerQuestionAnswer(
      player0.playerId,
      2,
      [
        quizInfo.questions[1].answers[0].answerId,
        quizInfo.questions[1].answers[1].answerId,
      ]
    );

    await sleep(500);

    requestPlayerQuestionAnswer(
      player1.playerId,
      2,
      [
        quizInfo.questions[1].answers[0].answerId,
        quizInfo.questions[1].answers[1].answerId
      ]
    );

    const expectedSessionResults = {
      usersRankedByScore: [
        {
          name: 'player0',
          score: 10
        },
        {
          name: 'player1',
          score: 5
        }
      ],
      questionResults: [
        {
          questionId: question0.questionId,
          playersCorrectList: [
            'player0', 'player1'
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100
        },
        {
          questionId: question1.questionId,
          playersCorrectList: [
            'player0', 'player1'
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100
        },
      ]
    };

    // Set the state to GO_TO_FINAL_RESULTS
    requestAdminQuizSessionState(
      user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER'
    );
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');

    expect(requestPlayerSessionResults(player1.playerId)).toEqual(expectedSessionResults);
    expect(requestPlayerSessionResults(player0.playerId)).toEqual(expectedSessionResults);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });
});

describe('requestPlayerSessionResults is invalid', () => {
  beforeEach(() => {
    requestClear();
    user = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
    quiz = requestAdminQuizCreate(user.token, 'Quiz', 'test');
    question0 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, question0Body);
    question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, question1Body);
    session = requestAdminQuizSessionStart(user.token, quiz.quizId, 2);
    player0 = requestPlayerSessionJoin(session.sessionId, 'player0');
    player1 = requestPlayerSessionJoin(session.sessionId, 'player1');
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN');
  });
  test('playerId does not exist', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    // Both players answer question0, player 0 is correct, player 1 is incorrect
    requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[0].answers[0].answerId]);
    requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[0].answers[1].answerId]);

    // Set session state to NEXT_QUESTION
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION');
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN');

    // Both players answer question1, player 0 is correct, player 1 is incorrect
    requestPlayerQuestionAnswer(
      player0.playerId,
      2,
      [
        quizInfo.questions[1].answers[0].answerId,
        quizInfo.questions[1].answers[1].answerId,
      ]
    );

    requestPlayerQuestionAnswer(
      player1.playerId,
      2,
      [
        quizInfo.questions[1].answers[2].answerId,
      ]
    );

    // Set the state to GO_TO_FINAL_RESULTS
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'GO_TO_FINAL_RESULTS');

    // -player1.playerId is invalid
    expect(requestPlayerSessionResults(-player1.playerId)).toEqual(ERROR400);
    expect(requestPlayerSessionResults(-player0.playerId)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });

  test('Session is not in FINAL_RESULTS state', () => {
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    // Both players answer question0, player 0 is correct, player 1 is incorrect
    requestPlayerQuestionAnswer(player0.playerId, 1, [quizInfo.questions[0].answers[0].answerId]);
    requestPlayerQuestionAnswer(player1.playerId, 1, [quizInfo.questions[0].answers[1].answerId]);

    // Set the state not GO_TO_FINAL_RESULTS
    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'GO_TO_ANSWER');
    expect(requestPlayerSessionResults(player1.playerId)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'NEXT_QUESTION');
    expect(requestPlayerSessionResults(player1.playerId)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'SKIP_COUNTDOWN');
    expect(requestPlayerSessionResults(player1.playerId)).toEqual(ERROR400);

    requestAdminQuizSessionState(user.token, quiz.quizId, session.sessionId, 'END');
  });
});
