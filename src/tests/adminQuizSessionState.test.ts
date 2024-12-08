import {
  requestClear, requestAdminAuthRegister, requestAdminAuthLogout,
  requestAdminQuizCreate, requestAdminQuizTransferOwner,
  requestAdminQuizQuestionCreate,
  // requestAdminQuizRemove,
  // requestAdminQuizSessionsView,
  requestAdminQuizSessionStart, requestAdminQuizSessionState,
  requestPlayerSessionJoin,
  requestAdminQuizSessionStatus,
} from './requests';

import { QuizAction } from '../testTypes';

const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };
const ERROR403 = { error: expect.any(String), status: 403 };

let quiz0: { quizId: number };
let user0: { token: string };
let user1: { token: string };
let session0: { sessionId: number };

async function sleep(ms: number): Promise<undefined> {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

beforeEach(() => {
  requestClear();
  user0 = requestAdminAuthRegister('test0@gmail.com', 'Password0', 'First', 'Last');
  quiz0 = requestAdminQuizCreate(user0.token, 'Test', 'Test');

  const question = {
    question: 'What is the meaning of life?',
    answers: [
      { answer: '42', correct: true },
      { answer: 'love', correct: false },
      { answer: 'one', correct: false },
      { answer: 'x', correct: false }
    ],
    duration: 1,
    points: 5,
    thumbnailUrl: 'http://google.com/some/image/path.jpg'
  };
  requestAdminQuizQuestionCreate(user0.token, quiz0.quizId, question);
  requestAdminQuizQuestionCreate(user0.token, quiz0.quizId, question);

  session0 = requestAdminQuizSessionStart(user0.token, quiz0.quizId, 1);
});

describe('adminQuizSessionState - success !', () => {
  test('valid case', () => {
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });

  test('valid case', () => {
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION')).toStrictEqual({});
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN')).toStrictEqual({});
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER')).toStrictEqual({});
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS')).toStrictEqual({});
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });
});

// skip for now, merge after session status
describe('setTimeOut working', () => {
  test('QuestionCountdown lasts for three seconds', async () => {
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION');
    await sleep(3000);
    expect(requestAdminQuizSessionStatus(user0.token, quiz0.quizId, session0.sessionId).state).toStrictEqual('QUESTION_OPEN');
  });
  test('QUESTION_OPEN lasts for duration then becomes QUESTION_CLOSED ', async () => {
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    await sleep(1000);
    expect(requestAdminQuizSessionStatus(user0.token, quiz0.quizId, session0.sessionId).state).toStrictEqual('QUESTION_CLOSE');
  });
});

describe('adminQuizSessionState - error 400', () => {
  test('invalid session id', () => {
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, -session0.sessionId, 'END')).toStrictEqual(ERROR400);
  });

  test('invalid action - not an enum', () => {
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'asdfghjkl' as QuizAction)).toStrictEqual(ERROR400);
  });
});

describe('adminQuizSessionState - error 401', () => {
  test('token missing', () => {
    expect(requestAdminQuizSessionState('', quiz0.quizId, session0.sessionId, 'END')).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    expect(requestAdminQuizSessionState('999', quiz0.quizId, session0.sessionId, 'END')).toStrictEqual(ERROR401);
  });

  test('token invalid', () => {
    requestAdminAuthLogout(user0.token);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual(ERROR401);
  });
});

describe('adminQuizSessionState - error 403', () => {
  test('user not owner', () => {
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
    expect(requestAdminQuizSessionState(user1.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual(ERROR403);
  });

  test('quiz transfer', () => {
    user1 = requestAdminAuthRegister('test1@gmail.com', 'Password1', 'First-i', 'Last-i');
    requestAdminQuizTransferOwner(user0.token, quiz0.quizId, 'test1@gmail.com');
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual(ERROR403);
  });
});

describe('adminQuizSessionState - invalid actions ', () => {
  test('invalid action at LOBBY state', () => {
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER')).toStrictEqual(ERROR400);
  });

  test('invalid action at QUESTION_COUNTDOWN state', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');

    // autostartnum is 1, therefore at QUESTION_COUNTDOWN state
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION')).toStrictEqual(ERROR400);
  });

  test('invalid action at QUESTION_OPEN state', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION')).toStrictEqual(ERROR400);
  });

  test('invalid action at QUESTION_CLOSE state', async () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    await sleep(1000);

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN')).toStrictEqual(ERROR400);
  });

  test('invalid action at ANSWER_SHOW state', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER')).toStrictEqual(ERROR400);
  });

  test('invalid action at FINAL_RESULTS state', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS');

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS')).toStrictEqual(ERROR400);
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION')).toStrictEqual(ERROR400);
  });
});

describe('adminQuizSessionState - valid actions ', () => {
  test('NEXT_QUESTION at LOBBY state', () => {
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION')).toStrictEqual({});
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });
  test('END at LOBBY state', () => {
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });

  test('END at QUESTION_COUNTDOWN', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');

    // autostartnum is 1, therefore at QUESTION_COUNTDOWN state
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });

  test('SKIP_COUNTDOWN at QUESTION_COUNTDOWN', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');

    // autostartnum is 1, therefore at QUESTION_COUNTDOWN state
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN')).toStrictEqual({});
  });

  test('GO_TO_ANSWER at QUESTION_OPEN', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');

    // autostartnum is 1, therefore at QUESTION_COUNTDOWN state
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER')).toStrictEqual({});
  });

  test('END at QUESTION_OPEN', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');

    // autostartnum is 1, therefore at QUESTION_COUNTDOWN state
    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });

  test('END at QUESTION_CLOSE', async () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    await sleep(1000);

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });

  test('NEXT_QUESTION at QUESTION_CLOSE', async () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    await sleep(1000);

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION')).toStrictEqual({});
  });

  test('GO_TO_ANSWER at QUESTION_CLOSE', async () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    await sleep(1000);

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER')).toStrictEqual({});
  });

  test('GO_TO_FINAL_RESULTS at QUESTION_CLOSE', async () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    await sleep(1000);

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS')).toStrictEqual({});
  });

  test('GO_TO_FINAL_RESULTS at ANSWER_SHOW', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS')).toStrictEqual({});
  });

  test('END at ANSWER_SHOW', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });

  test('NEXT_QUESTION at ANSWER_SHOW', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'NEXT_QUESTION')).toStrictEqual({});
  });

  test('END at FINAL_RESULTS', () => {
    requestPlayerSessionJoin(session0.sessionId, 'player0');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'SKIP_COUNTDOWN');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_ANSWER');
    requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'GO_TO_FINAL_RESULTS');

    expect(requestAdminQuizSessionState(user0.token, quiz0.quizId, session0.sessionId, 'END')).toStrictEqual({});
  });
});
