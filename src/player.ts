import { generateRandomName, playerQuestionResultsHelper, stringifyToken, uniquePlayerId } from './helpers';
import { getData, setData } from './dataStore';
import HTTPError from 'http-errors';
import {
  Player, Message, PlayerQuestionInfo, QuestionResult, QuizResults,
  QuizState, Quiz, QuizAction, QuizSession, Question
} from './types';
import { adminQuizSessionState } from './quiz';

const ONE_SECOND = 1000;

/**
 * Allows a player to join a quiz session.
 *
 * @param {number} sessionId - The ID of the quiz session to join.
 * @param {string} name - The name of the player joining the session.
 *
 * @returns {Object} - An object containing the ID of the newly joined player.
 *
 * @throws {HTTPError} - Throws an error if the session ID is invalid, the session is not in the LOBBY state,
 *                        or the player name is not unique within the session.
 */
function playerSessionJoin(sessionId: number, name: string): { playerId: number } {
  const data = getData();
  const session = data.quizSessions.find(session => session.quizSessionId === sessionId);

  if (!session) {
    throw HTTPError(400, 'Session Id does not refer to a valid session');
  } else if (session.state !== QuizState.LOBBY) {
    throw HTTPError(400, 'Session is not in LOBBY state');
  }

  const quizPlayers: Player[] = data.activePlayers.filter(
    activePlayer => session.players.includes(activePlayer.playerId)
  );

  // Check if name is empty, generate random name if needed
  if (!name.trim()) {
    name = generateRandomName(quizPlayers);
  }

  const nameIsInSession = quizPlayers.some(player => player.name === name);
  if (nameIsInSession) {
    throw HTTPError(400, 'Name of user entered is not unique');
  }

  // Add player to the session
  // Change timer
  const playerId = uniquePlayerId(quizPlayers);
  const newPlayer: Player = {
    quizSessionId: sessionId,
    name: name,
    playerId: playerId,
    submissionTimes: [],
    answerSubmissions: [],
  };
  session.players.push(playerId);
  data.activePlayers.push(newPlayer);
  setData(data);

  if (session.players.length === session.autoStartNum) {
    const quiz: Quiz = data.quizzes.find(quiz => quiz.quizId === session.quizId);
    const token = data.activeUsers.find(user => user.user === quiz.ownerId).token;

    adminQuizSessionState(stringifyToken(token), quiz.quizId, sessionId, QuizAction.NEXT_QUESTION);
  }

  // Return player id
  return { playerId: playerId };
}

/**
 * Retrieves the status of a player's quiz session.
 *
 * @param {number} playerId - The ID of the player.
 *
 * @returns {Object} - An object containing the state of the session, the total number of questions,
 *                     and the current question number.
 *
 * @throws {HTTPError} - Throws an error if the player ID does not exist.
 */
function playerSessionStatus(playerId: number): { state: QuizState, numQuestions: number, atQuestion: number } {
  const data = getData();

  const player = data.activePlayers.find(player => player.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Player ID does not exist');
  }
  const session = data.quizSessions.find(session => session.quizSessionId === player.quizSessionId);

  const quiz = data.quizzes.find(quiz => quiz.quizId === session.quizId);

  return { state: session.state, numQuestions: quiz.questions.length, atQuestion: session.atQuestion };
}

/**
 * Retrieves information about a specific question for a player.
 *
 * @param {number} playerId - The ID of the player.
 * @param {number} questionPosition - The position of the question in the quiz.
 *
 * @returns {PlayerQuestionInfo} - An object containing information about the question.
 *
 * @throws {HTTPError} - Throws an error if the player ID does not exist, the player is not part of the quiz,
 *                        the question position is invalid, or the session is in an invalid state.
 */
function playerQuestionInfo(playerId: number, questionPosition: number): PlayerQuestionInfo {
  const data = getData();
  const player = data.activePlayers.find(player => player.playerId === playerId);

  if (!player) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  const quizSession = getData().quizSessions.find(session => session.quizSessionId === player.quizSessionId);

  // Get the quiz
  const quiz: Quiz = data.quizzes.find(quiz => quiz.quizId === quizSession.quizId);

  if (questionPosition <= 0 || questionPosition > quiz.questions.length) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }

  if (quizSession.state === 'LOBBY') {
    throw HTTPError(400, 'Session is in LOBBY state.');
  }

  if (quizSession.state === 'QUESTION_COUNTDOWN') {
    throw HTTPError(400, 'Session is in QUESTION_COUNTDOWN state.');
  }

  if (quizSession.state === 'END') {
    throw HTTPError(400, 'Session is in END state.');
  }

  if (questionPosition !== quizSession.atQuestion + 1) {
    throw HTTPError(400, 'Session is not on this question');
  }

  const question: Question = quiz.questions[questionPosition - 1];
  const answers: {answerId : number, answer: string, colour: string}[] = [];

  question.answers.forEach(answer => {
    answers.push(
      {
        answerId: answer.answerId,
        answer: answer.answer,
        colour: answer.colour
      }
    );
  });

  const questionInfo: PlayerQuestionInfo = {
    questionId: question.questionId,
    question: question.question,
    duration: question.duration,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points,
    answers: answers
  };
  return questionInfo;
}

/**
 * Submits a player's answer to a question.
 *
 * @param {number} playerId - The ID of the player.
 * @param {number} questionPosition - The position of the question in the quiz.
 * @param {number[]} answerIds - An array of answer IDs selected by the player.
 *
 * @returns {Object} - An empty object.
 *
 * @throws {HTTPError} - Throws an error if the player ID does not exist, the player is not part of the quiz,
 *                        the question position is invalid, the session is not in the QUESTION_OPEN state,
 *                        less than 1 answer ID is submitted, there are duplicate answer IDs, or the answer IDs
 *                        are not valid for the question.
 */
function playerQuestionAnswer(playerId: number, questionPosition: number, answerIds: number[]): Record<string, never> {
  const data = getData();

  const player = data.activePlayers.find(player => player.playerId === playerId);

  if (!player) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  const quizSession = getData().quizSessions.find(session => session.quizSessionId === player.quizSessionId);

  // Get the quiz
  const quiz: Quiz = data.quizzes.find(quiz => quiz.quizId === quizSession.quizId);

  if (questionPosition <= 0 || questionPosition > quiz.questions.length) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }

  if (quizSession.state !== 'QUESTION_OPEN') {
    throw HTTPError(400, 'Session is not in QUESTION_OPEN state');
  }

  if (questionPosition !== quizSession.atQuestion + 1) {
    throw HTTPError(400, 'Session is not on this question');
  }

  if (answerIds.length < 1) {
    throw HTTPError(400, 'Less than 1 answer ID was submitted');
  }

  if (new Set(answerIds).size !== answerIds.length) {
    throw HTTPError(400, 'There are duplicate answer IDs provided');
  }

  // Possible answer IDs for the specified question
  const possibleAnswerIds = quiz.questions[questionPosition - 1].answers.map(possibleAnswer => possibleAnswer.answerId);

  // If we find an answer that is not included in the possible answers return error
  if (answerIds.find(answerId => !possibleAnswerIds.includes(answerId))) {
    throw HTTPError(400, 'Answer IDs are not valid for this particular question');
  }

  player.submissionTimes[questionPosition - 1] = Math.floor(Date.now() / ONE_SECOND);
  player.answerSubmissions[questionPosition - 1] = answerIds;

  setData(data);

  return {};
}

/**
 * Retrieves the results of a specific question for a player.
 *
 * @param {number} playerId - The ID of the player.
 * @param {number} questionPosition - The position of the question in the quiz.
 *
 * @returns {QuestionResult} - An object containing the results of the question.
 *
 * @throws {HTTPError} - Throws an error if the player ID does not exist, the player is not part of the quiz,
 *                        the session is not in the ANSWER_SHOW state, the question position is invalid, or
 *                        the session has not reached the specified question yet.
 */
function playerQuestionResults(playerId: number, questionPosition: number): QuestionResult {
  const data = getData();
  const player = data.activePlayers.find(player => player.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  const quizSession = getData().quizSessions.find(session => session.quizSessionId === player.quizSessionId);

  // get the quiz
  const quiz: Quiz = data.quizzes.find(quiz => quiz.quizId === quizSession.quizId);

  if (quizSession.state !== QuizState.ANSWER_SHOW) {
    throw HTTPError(400, 'Session is not in ANSWER_SHOW state');
  }

  if (questionPosition <= 0 || questionPosition > quiz.questions.length) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }

  if (quizSession.atQuestion !== questionPosition - 1) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }

  const questionResult = playerQuestionResultsHelper(
    quizSession, quiz.questions[questionPosition - 1], questionPosition - 1, [], []
  );

  return questionResult;
}

/**
 * Retrieves the overall results of a player's quiz session.
 *
 * @param {number} playerId - The ID of the player.
 *
 * @returns {QuizResults} - An object containing the ranked scores of users and the results of each question.
 *
 * @throws {HTTPError} - Throws an error if the player ID does not exist or the session is not in the FINAL_RESULTS state.
 */
function playerSessionResults(playerId: number): QuizResults {
  const data = getData();

  // find the player
  const player = data.activePlayers.find(player => player.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'the playerId does not exist.');
  }

  // find the session of the player
  const sessionId = player.quizSessionId;
  const session: QuizSession = data.quizSessions.find(session => session.quizSessionId === sessionId);

  // check if state is FINAL_RESULTS
  if (session.state !== QuizState.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  // get the Quiz
  const quiz: Quiz = data.quizzes.find(quiz => quiz.quizId === session.quizId);

  // get other players in the session
  const players: Player[] = data.activePlayers.filter(
    activePlayer => session.players.includes(activePlayer.playerId)
  );
  // initialise a scores array of the length of the total number of session players
  const scores: number[] = new Array(session.players.length).fill(0);
  // make the QuestionResult array
  const questionResults: QuestionResult[] = [];

  for (let i = 0; i < quiz.questions.length; i++) {
    const result = playerQuestionResultsHelper(session, quiz.questions[i], i, scores, []);
    questionResults.push(result);
  }

  // sort players by score
  const usersRankedByScore = scores
    .map((score, index) => ({ name: players[index].name, score }))
    .sort((a, b) => b.score - a.score);

  return { usersRankedByScore, questionResults };
}

/**
 * Retrieves the chat messages of a player's quiz session.
 *
 * @param {number} playerId - The ID of the player.
 *
 * @returns {Object} - An object containing an array of chat messages.
 *
 * @throws {HTTPError} - Throws an error if the player ID does not exist.
 */
function playerSessionChatView(playerId: number): {messages: Message[]} {
  const data = getData();
  const player = data.activePlayers.find(player => player.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'the playerId does not exist.');
  }

  const session = data.quizSessions.find(session => session.quizSessionId === player.quizSessionId);
  return { messages: session.messages };
}

function playerSessionChatSend(playerId: number, message: {messageBody: string}): Record<string, never> {
  const data = getData();
  const player = data.activePlayers.find(player => player.playerId === playerId);

  if (!player) {
    throw HTTPError(400, 'Player ID does not exist');
  }
  const messageBody = message.messageBody;
  if (!messageBody || messageBody.trim().length === 0) {
    throw HTTPError(400, 'Message cannot be empty');
  }
  if (messageBody.length > 100) {
    throw HTTPError(400, 'Message cannot exceed 100 characters');
  }

  const session = data.quizSessions.find(session => session.quizSessionId === player.quizSessionId);
  const newMessage: Message = {
    messageBody: message.messageBody,
    playerId: player.playerId,
    playerName: player.name,
    timeSent: Math.floor(Date.now() / ONE_SECOND),
  };

  session.messages.push(newMessage);
  setData(data);
  return {};
}

export {
  playerSessionJoin, playerSessionStatus, playerQuestionInfo, playerQuestionAnswer,
  playerQuestionResults, playerSessionResults, playerSessionChatView, playerSessionChatSend
};
