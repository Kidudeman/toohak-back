import request, { HttpVerb } from 'sync-request-curl';
import { port, url } from '../config.json';
import { IncomingHttpHeaders } from 'http';
import { QuestionBody, QuizAction, QuizInfo, QuizList, QuizState, QuestionResult, QuizResults, QuizSessionStatus } from '../testTypes';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 10000;

interface Payload {
  [key: string]: unknown;
}

const requestHelper = (
  method: HttpVerb,
  path: string,
  payload: Payload,
  headers: IncomingHttpHeaders = {}
): unknown => {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method.toUpperCase())) {
    qs = payload;
  } else {
    // PUT/POST
    json = payload;
  }

  const url = SERVER_URL + path;
  const res = request(method, url, { qs, json, headers, timeout: TIMEOUT_MS });

  let responseBody: object;

  try {
    responseBody = JSON.parse(res.body.toString());
  } catch (err) {
    return { error: 'Unable to parse body', statusCode: 500 };
  }

  if (res.statusCode !== 200 && 'error' in responseBody) {
    return { error: responseBody.error, status: res.statusCode };
  }
  return responseBody;
};

export const requestClear = () => {
  return requestHelper('DELETE', '/v1/clear', {});
};

export const requestAdminAuthRegister = (email: string, password: string, nameFirst: string, nameLast: string) => {
  return requestHelper('POST', '/v1/admin/auth/register', { email, password, nameFirst, nameLast }, {}) as { token: string };
};

export const requestAdminAuthLogin = (email: string, password: string) => {
  return requestHelper('POST', '/v1/admin/auth/login', { email, password }, {}) as {token: string};
};

export const requestAdminUserDetails = (token: string) => {
  return requestHelper('GET', '/v2/admin/user/details', {}, { token }) as {
    user: {
      userId: number,
      name: string,
      email: string,
      numSuccessfulLogins: number,
      numFailedPasswordsSinceLastLogin: number
    }
  };
};

export const requestAdminUserDetailsUpdate = (token: string, email: string, nameFirst: string, nameLast: string) => {
  return requestHelper('PUT', '/v2/admin/user/details', { email, nameFirst, nameLast }, { token }) as Record<string, never>;
};

export const requestAdminUserPasswordUpdate = (token: string, oldPassword: string, newPassword: string) => {
  return requestHelper('PUT', '/v2/admin/user/password', { oldPassword, newPassword }, { token }) as Record<string, never>;
};

export const requestAdminQuizCreate = (token: string, name: string, description: string) => {
  return requestHelper('POST', '/v2/admin/quiz', { name, description }, { token }) as {quizId: number};
};

export const requestAdminQuizRemove = (token: string, quizId: number) => {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizId}`, {}, { token }) as Record<string, never>;
};

export const requestAdminQuizList = (token: string) => {
  return requestHelper('GET', '/v2/admin/quiz/list', {}, { token }) as {quizzes: QuizList[]};
};

export const requestAdminQuizInfo = (token: string, quizId: number) => {
  return requestHelper('GET', `/v2/admin/quiz/${quizId}`, {}, { token }) as QuizInfo;
};

export const requestAdminQuizNameUpdate = (token: string, quizId: number, name: string) => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/name`, { name }, { token }) as Record<string, never>;
};

export const requestAdminQuizDescriptionUpdate = (token: string, quizId: number, description: string) => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/description`, { description }, { token }) as Record<string, never>;
};

export const requestAdminAuthLogout = (token: string) => {
  return requestHelper('POST', '/v2/admin/auth/logout', {}, { token }) as {token: string};
};

export const requestAdminQuizTrashView = (token: string) => {
  return requestHelper('GET', '/v2/admin/quiz/trash', {}, { token }) as {quizzes: QuizList[]};
};

export const requestAdminQuizTrashRestore = (token: string, quizId: number) => {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/restore`, {}, { token }) as Record<string, never>;
};

export const requestAdminQuizTrashEmpty = (token: string, quizIds: number[]) => {
  return requestHelper('DELETE', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token }) as Record<string, never>;
};

export function requestAdminQuizTransferOwner(token: string, quizId: number, userEmail: string) {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/transfer`, { userEmail }, { token }) as Record<string, never>;
}

export function requestAdminQuizQuestionCreate(token: string, quizId: number, questionBody: QuestionBody) {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/question`, { questionBody }, { token }) as {questionId: number};
}

export function requestAdminQuizQuestionUpdate(token: string, quizId: number, questionId: number, questionBody: QuestionBody) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}`, { questionBody }, { token }) as Record<string, never>;
}

export function requestAdminQuizQuestionDelete(token: string, quizId: number, questionId: number) {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizId}/question/${questionId}`, {}, { token }) as Record<string, never>;
}

export function requestAdminQuizQuestionMove(token: string, quizId: number, questionId: number, newPosition: number) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}/move`, { newPosition }, { token }) as Record<string, never>;
}

export function requestAdminQuizQuestionDuplicate(token: string, quizId: number, questionId: number) {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/question/${questionId}/duplicate`, { }, { token }) as {newQuestionId: number};
}

// Iteration 3 functions
export function requestAdminQuizThumbnailUpdate(token: string, quizId: number, imgUrl: string) {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/thumbnail`, { imgUrl }, { token }) as Record<string, never>;
}

export function requestAdminQuizSessionsView(token: string, quizId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/sessions`, {}, { token }) as {activeSessions: number[], inactiveSessions: number[]};
}

export function requestAdminQuizSessionStart(token: string, quizId: number, autoStartNum: number) {
  return requestHelper('POST', `/v1/admin/quiz/${quizId}/session/start`, { autoStartNum }, { token }) as {sessionId: number};
}

export function requestAdminQuizSessionState(token: string, quizId: number, sessionId: number, action: QuizAction) {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { action }, { token }) as Record<string, never>;
}

export function requestAdminQuizSessionStatus(token: string, quizId: number, sessionId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token }) as QuizSessionStatus;
}

export function requestAdminQuizSessionResults(token: string, quizId: number, sessionId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {}, { token }) as QuizResults;
}

export function requestAdminQuizSessionResultsLink(token: string, quizId: number, sessionId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, {}, { token }) as {url: string};
}

export function requestPlayerSessionJoin(sessionId: number, name: string) {
  return requestHelper('POST', '/v1/player/join', { sessionId, name }, {}) as {playerId: number};
}

export function requestPlayerSessionStatus(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}`, {}, {}) as {state: QuizState, numQuestions: number, atQuestion: number};
}

export function requestPlayerQuestionInfo(playerId: number, questionPosition: number) {
  return requestHelper('GET', `/v1/player/${playerId}/question/${questionPosition}`, {}, {}) as {
    questionId: number,
    question: string,
    duration: number,
    thumbnailUrl: string,
    points: number,
    answers: {
      answerId: number,
      answer: string,
      colour: string,
    }[];
  };
}

export function requestPlayerQuestionAnswer(playerId: number, questionPosition: number, answerIds: number[]) {
  return requestHelper('PUT', `/v1/player/${playerId}/question/${questionPosition}/answer`, { answerIds }, {}) as Record<string, never>;
}

export function requestPlayerQuestionResults(playerId: number, questionPosition: number) {
  return requestHelper('GET', `/v1/player/${playerId}/question/${questionPosition}/results`, {}, {}) as QuestionResult;
}

export function requestPlayerSessionResults(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}/results`, {}, {}) as QuizResults;
}

export function requestPlayerSessionChatView(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}/chat`, {}, {}) as {
    messages: [
      {
        messageBody: string,
        playerId: number,
        playerName: string,
        timeSent: number
      }
    ]
  };
}

export function requestPlayerSessionChatSend(playerId: number, message: {messageBody: string}) {
  return requestHelper('POST', `/v1/player/${playerId}/chat`, { message }, {}) as Record<string, never>;
}
