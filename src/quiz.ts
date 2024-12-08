import { getData, setData } from './dataStore';
import {
  Question, Quiz, User, Answer,
  QuizState, QuizAction, QuizSession,
  Player, QuestionResult
} from './types';
import {
  QuizList, QuizInfo, QuestionBody, QuizResults,
  QuizSessionInfo, QuizSessionStatus, QuizID
} from './types';
import {
  generateUniqueNumberId, getQuizById, getQuestion,
  getUserByToken, getRandomColour, playerQuestionResultsHelper
} from './helpers';
import HTTPError from 'http-errors';
import { mkdirSync, writeFileSync } from 'fs';

const QUIZ_NAME_MIN = 3;
const QUIZ_NAME_MAX = 30;
const QUIZ_DESCRIPTION_MAX = 100;
const ONE_SECOND = 1000;
const THREE_SECONDS = 3000;
const QUESTION_MIN_LEN = 5;
const QUESTION_MAX_LEN = 50;
const ANSWER_NUM_MIN = 2;
const ANSWER_NUM_MAX = 6;
const THREE_MINUTES = 180;
const QUESTION_MIN_POINT = 1;
const QUESTION_MAX_POINT = 10;
const ANSWER_MIN_LENGTH = 1;
const ANSWER_MAX_LENGTH = 30;

/**
 * Creates a new quiz with a unique ID.
 *
 * @param {string} token - The authentication token of the admin creating the quiz.
 * @param {string} name - The name of the quiz.
 * @param {string} description - The description of the quiz.
 *
 * @returns {Object} - An object containing the ID of the newly created quiz.
 */
function adminQuizCreate(token: string, name: string, description: string): { quizId: number } {
  const data = getData();

  // get the user
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  if (name.length < QUIZ_NAME_MIN || name.length > QUIZ_NAME_MAX) {
    throw HTTPError(400, 'Name is either less than 3 characters long or more than 30 characters long.');
  }

  if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
    throw HTTPError(400, 'Name contains invalid characters. Valid characters are alphanumeric and spaces.');
  }

  const userQuizzes = data.quizzes.filter((idx) => idx.ownerId === user.authUserId);
  const existingQuiz = userQuizzes.find((idx) => idx.name === name);

  if (existingQuiz) {
    throw HTTPError(400, 'Name is already used by the current logged in user for another quiz.');
  }

  if (description.length > QUIZ_DESCRIPTION_MAX) {
    throw HTTPError(400, 'Description is more than 100 characters in length.');
  }
  // Function to generate a unique quiz ID
  const newQuizId = generateUniqueNumberId();

  // Time calculation
  const currentTime = Math.floor(Date.now() / ONE_SECOND);

  const newQuiz: Quiz = {
    quizId: newQuizId,
    ownerId: user.authUserId,
    name: name,
    description: description,
    timeCreated: currentTime,
    timeLastEdited: currentTime,
    playerIds: [user.authUserId],
    questions: [],
    thumbnailUrl: '',
    duration: 0,
    sessions: [user.authUserId]
  };

  // Add the quiz to the user's list of quizzes
  user.quizList.push(newQuizId);
  // Push into data structure
  data.quizzes.push(newQuiz);
  setData(data);

  return {
    quizId: newQuizId
  };
}

/**
 * Removes a quiz.
 *
 * @param {string} token - The authentication token of the admin removing the quiz.
 * @param {number} quizId - The ID of the quiz to be removed.
 *
 * @returns {Object} - An empty object indicating the success/failure of the removal operation.
 */
function adminQuizRemove(token: string, quizId: number): Record<string, never> {
  const data = getData();

  // get the user
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // get the quiz
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  const quizzes = getData().quizzes;

  data.trash.push(quizzes.find(quiz => quiz.quizId === quizId));
  user.quizList.splice(user.quizList.findIndex(quiz => quiz === quizId), 1);
  data.quizzes.splice(quizzes.findIndex(quiz => quiz.quizId === quizId), 1);
  setData(data);

  return {};
}

/**
 * Retrieves a list of quizzes.
 *
 * @param {string} token - The authentication token of the admin retrieving the quiz list.
 *
 * @returns {Object} - An object containing an array of quizzes.
 */
function adminQuizList(token: string): { quizzes: QuizList[] } {
  const data = getData();

  // get the user
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  const ownedQuizzes = user.quizList;
  const adminQuizListReturnObject: QuizList[] = [];

  ownedQuizzes.forEach((idx) => {
    const quizObj = data.quizzes.find(quiz => quiz.quizId === idx);
    adminQuizListReturnObject.push({
      quizId: quizObj.quizId,
      name: quizObj.name,
    });
  });

  setData(data);

  return { quizzes: adminQuizListReturnObject };
}

/**
 * Get all of the relevant information about the current quiz.
 *
 * @param {string} token - The authentication token.
 * @param {string} quizId - The ID of the quiz.
 *
 * @returns {Object} - Returns an object with the quiz information.
 */
function adminQuizInfo(token: string, quizId: number): QuizInfo {
  // get the user
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // get the quiz
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  const quizInfo: QuizInfo = {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    questions: quiz.questions,
    duration: quiz.duration,
    thumbnailUrl: quiz.thumbnailUrl
  };
  return quizInfo;
}

/**
 * Update the name of the relevant quiz.
 *
 * @param {string} token - The authentication token.
 * @param {string} quizId - The ID of the quiz.
 * @param {string} name - The new name for the quiz.
 *
 * @returns {Object} - Returns an empty object.
 */
export function adminQuizNameUpdate(token: string, quizId: number, name: string): Record<string, never> {
  const data = getData();

  // get the user
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // get the quiz
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  // check that name contains valid characters
  const regex = /^[a-zA-Z0-9\s]+$/;

  if (!regex.test(name)) {
    throw HTTPError(400, 'Name contains invalid characters.');
  }

  // check name length
  if (name.length < QUIZ_NAME_MIN || name.length > QUIZ_NAME_MAX) {
    throw HTTPError(400, 'Name is too short or too long.');
  }

  // check if there is another quiz with the same name, and then check
  // if it is owned by current user
  const quizWithSameName = data.quizzes.find(quiz => quiz.name === name);
  if (quizWithSameName && quizWithSameName.ownerId === user.authUserId) {
    throw HTTPError(400, 'User already owns a quiz with this name.');
  }

  // update quiz name
  quiz.name = name;

  // time calculation
  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;
  setData(data);

  return {};
}

/**
 * Update the description of the relevant quiz.
 *
 * @param {string} token - The authentication token.
 * @param {string} quizId - The ID of the quiz.
 * @param {string} description - The new description for the quiz.
 *
 * @returns {Object} - Returns an empty object.
 */
export function adminQuizDescriptionUpdate(token: string, quizId: number, description: string): Record<string, never> {
  // get the user
  const data = getData();
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // get the quiz
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  // check new description length
  if (description.length > QUIZ_DESCRIPTION_MAX) {
    throw HTTPError(400, 'Description must not be longer than 100 characters.');
  }

  // update description of quiz
  quiz.description = description;

  // time calculation
  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;
  setData(data);

  return {};
}

/**
 * View the quizzes that are currently in the trash for the logged in user
 *
 * @param {string} token - Token of user.
 *
 * @returns {quizzes: QuizList[]} - Returns an array with quiz list.
 */
function adminQuizTrashView(token: string): { quizzes: QuizList[] } {
  const data = getData();

  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  const usersTrash = data.trash.filter((idx) => idx.ownerId === user.authUserId);
  const adminQuizListReturnObject: QuizList[] = [];

  usersTrash.forEach((quiz) => {
    adminQuizListReturnObject.push({
      quizId: quiz.quizId,
      name: quiz.name
    });
  });

  setData(data);

  return { quizzes: adminQuizListReturnObject };
}

/**
 * Updates a question in a quiz.
 *
 * @param {string} token - The authentication token.
 * @param {number} quizId - The ID of the quiz.
 *
 * @returns {Object} - Returns an empty object or an error object.
 */
function adminQuizTrashRestore(token: string, quizId: number): Record<string, never> {
  const data = getData();

  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token invalid or empty');
  }

  const trash: Quiz | undefined = data.trash.find((idx) => idx.quizId === quizId);
  const active: Quiz | undefined = data.quizzes.find((idx) => idx.quizId === quizId);

  // check error cases
  if (!trash && !active) {
    throw HTTPError(403, 'Quiz ID invalid');
  }
  if (trash && trash.ownerId !== user.authUserId) {
    throw HTTPError(403, 'User not quiz owner');
  }
  if (!trash && active) {
    throw HTTPError(400, 'Quiz not in trash');
  }

  const taken = data.quizzes.find((idx) => idx.name === trash.name);
  if (taken && taken.quizId !== quizId) {
    throw HTTPError(400, 'Quiz name taken');
  }

  // remove quiz from trash and push to active quizzes
  const index = data.trash.findIndex(idx => idx.quizId === quizId);
  const item = data.trash.splice(index, 1)[0];
  data.quizzes.push(item);

  // update the quizlist when restored from trash
  user.quizList.push(item.quizId);

  setData(data);

  return {};
}

/**
 * Removes matching quizzes from the trash given a token and an array of quiz IDs.
 *
 * @param {string} token - The authentication token.
 * @param {number[]} quizIds - An array of quiz IDs to remove from the trash.
 *
 * @returns {Object} - Returns an empty object or an error object.
 */
function adminQuizTrashEmpty(token: string, quizIds: number[]): Record<string, never> {
  const data = getData();

  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token invalid or empty');
  }

  let trash: Quiz | undefined;
  let active: Quiz | undefined;
  for (const quizId of quizIds) {
    trash = data.trash.find((idx) => idx.quizId === quizId);
    active = data.quizzes.find((idx) => idx.quizId === quizId);
    if (!trash && !active) {
      throw HTTPError(403, 'Quiz ID invalid');
    }
    if (trash && trash.ownerId !== user.authUserId) {
      throw HTTPError(403, 'User not quiz owner');
    }
  }
  for (const quizId of quizIds) {
    trash = data.trash.find((idx) => idx.quizId === quizId);
    if (!trash) {
      throw HTTPError(400, 'Quiz not in trash');
    }
  }

  let index;
  for (const quizId of quizIds) {
    index = data.trash.findIndex(idx => idx.quizId === quizId);
    data.trash.splice(index, 1);
  }

  setData(data);

  return {};
}

/**
 * Transfer ownership of a quiz to a different user based on their email
 *
 * @param {string} token - A unique identifier for user session
 * @param {number} quizId - A unique identifier for quiz id
 * @param {string} userEmail - A string containing email of the user to whom the quiz will be transferred
 * @returns {object} empty - An empty object if successful, otherwise returns an ErrorObject
 */
function adminQuizTransferOwner(token: string, quizId: number, userEmail: string): Record<string, never> {
  // Get the current logged-in user
  const data = getData();
  const currentUser: User | undefined = getUserByToken(token);
  if (!currentUser) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // Get the quiz
  const quiz: Quiz | undefined = getQuizById(quizId, currentUser);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  // Get the target user by email
  const targetUser: User | undefined = getData().users.find(user => user.email === userEmail);
  if (!targetUser) {
    throw HTTPError(400, 'The provided userEmail does not belong to a real user.');
  }

  // Check if the target user is the same as the current user
  if (targetUser.authUserId === currentUser.authUserId) {
    throw HTTPError(400, 'The provided userEmail belongs to the current logged-in user.');
  }

  // Check if the target user already has a quiz with the same name
  const existingQuiz: Quiz | undefined = getData().quizzes.find(
    q => q.ownerId === targetUser.authUserId && q.name === quiz.name
  );
  if (existingQuiz) {
    throw HTTPError(400, 'The target user already has a quiz with the same name.');
  }

  // Transfer ownership of the quiz to the target user
  quiz.ownerId = targetUser.authUserId;

  // Remove the quiz from the current user's quizList
  currentUser.quizList = currentUser.quizList.filter(id => id !== quizId);

  // Add the quiz to the target user's quizList
  targetUser.quizList.push(quizId);

  // Update the timeLastEdited of the quiz
  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;
  setData(data);

  return {};
}

/**
 * Creates a new question for a quiz.
 *
 * @param {string} token - The authentication token.
 * @param {number} quizId - The ID of the quiz.
 * @param {QuestionBody} questionBody - The body of the question to create.
 *
 * @returns {Object} - Returns an object containing the ID of the newly created question.
 */
function adminQuizQuestionCreate(token: string, quizId: number, questionBody: QuestionBody): { questionId: number } {
  // get the user
  const data = getData();
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  // get the quiz
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }
  // validate question string length
  if (questionBody.question.length < QUESTION_MIN_LEN || questionBody.question.length > QUESTION_MAX_LEN) {
    throw HTTPError(400, 'Question string must be between 5 and 50 characters in length.');
  }

  // validate number of answers
  if (questionBody.answers.length < ANSWER_NUM_MIN || questionBody.answers.length > ANSWER_NUM_MAX) {
    throw HTTPError(400, 'The question must have between 2 and 6 answers.');
  }

  // validate question duration
  if (questionBody.duration <= 0) {
    throw HTTPError(400, 'The question duration must be a positive number.');
  }

  // calculate total duration of all questions in the quiz
  const totalDuration = quiz.questions.reduce((sum, question) => sum + question.duration, 0);
  if (totalDuration + questionBody.duration > THREE_MINUTES) {
    throw HTTPError(400, 'The sum of the question durations in the quiz exceeds 3 minutes.');
  }

  // validate question points
  if (questionBody.points < QUESTION_MIN_POINT || questionBody.points > QUESTION_MAX_POINT) {
    throw HTTPError(400, 'The points awarded for the question must be between 1 and 10.');
  }

  // validate answer lengths
  const invalidAnswer = questionBody.answers.find(answer => answer.answer.length < ANSWER_MIN_LENGTH || answer.answer.length > ANSWER_MAX_LENGTH);
  if (invalidAnswer) {
    throw HTTPError(400, 'The length of any answer must be between 1 and 30 characters.');
  }

  // check for duplicate answers
  const uniqueAnswers = new Set(questionBody.answers.map(answer => answer.answer));
  if (uniqueAnswers.size !== questionBody.answers.length) {
    throw HTTPError(400, 'Answer strings must be unique within the same question.');
  }

  // check if there is at least one correct answer
  const hasCorrectAnswer = questionBody.answers.some(answer => answer.correct);
  if (!hasCorrectAnswer) {
    throw HTTPError(400, 'There must be at least one correct answer.');
  }

  if (questionBody.thumbnailUrl === '') {
    throw HTTPError(400, 'The thumbnailUrl is an empty string');
  }

  if (!questionBody.thumbnailUrl.endsWith('.jpg') &&
    !questionBody.thumbnailUrl.endsWith('.jpeg') &&
    !questionBody.thumbnailUrl.endsWith('.png')) {
    throw HTTPError(400, 'The thumbnailUrl does not end with jpg, jpeg, png.');
  }

  if (!questionBody.thumbnailUrl.startsWith('http://') &&
    !questionBody.thumbnailUrl.startsWith('https://')) {
    throw HTTPError(400, 'The thumbnailUrl does not begin with http:// or https://');
  }
  // generate a unique question id
  const questionId = generateUniqueNumberId();
  const answers: Answer[] = [];

  questionBody.answers.forEach((idx) => {
    answers.push({
      answerId: generateUniqueNumberId(),
      answer: idx.answer,
      colour: getRandomColour(),
      correct: idx.correct
    });
  });

  // create the new question
  const newQuestion: Question = {
    questionId,
    question: questionBody.question,
    answers: answers,
    duration: questionBody.duration,
    thumbnailUrl: questionBody.thumbnailUrl,
    points: questionBody.points
  };

  // add the new question to the quiz
  quiz.questions.push(newQuestion);
  // update the timeLastEdited of the quiz
  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;
  quiz.duration += questionBody.duration;
  setData(data);

  return { questionId };
}

/**
 * Updates a question in a quiz.
 *
 * @param {string} token - The authentication token.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} questionId - The ID of the question to update.
 * @param {Question} questionBody - The updated question body.
 *
 * @returns {Object} - Returns an empty object or an error object.
 */
function adminQuizQuestionUpdate(token: string, quizId: number, questionId: number, questionBody: Question): Record<string, never> {
  // check invalid token
  const data = getData();
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // check valid quizId
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  // check valid questionId
  const question: Question | undefined = getQuestion(quiz, questionId);
  if (!question) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  // validate question string length
  if (questionBody.question.length < QUESTION_MIN_LEN || questionBody.question.length > QUESTION_MAX_LEN) {
    throw HTTPError(400, 'Question string must be between 5 and 50 characters in length.');
  }

  // validate number of answers
  if (questionBody.answers.length < ANSWER_NUM_MIN || questionBody.answers.length > ANSWER_NUM_MAX) {
    throw HTTPError(400, 'The question must have between 2 and 6 answers.');
  }

  // validate question duration
  if (questionBody.duration <= 0) {
    throw HTTPError(400, 'The question duration must be a positive number.');
  }

  const questionIndex = quiz.questions.findIndex(idx => idx.questionId === questionId);

  // check quiz duration
  let duration = quiz.questions.reduce((sum, question) => sum + question.duration, 0);

  // remove current question duration, and add updated duration
  duration = duration - quiz.questions[questionIndex].duration + questionBody.duration;
  if (duration > THREE_MINUTES) {
    throw HTTPError(400, 'The sum of the question durations in the quiz exceeds 3 minutes.');
  }

  // validate question points
  if (questionBody.points < QUESTION_MIN_POINT || questionBody.points > QUESTION_MAX_POINT) {
    throw HTTPError(400, 'The points awarded for the question must be between 1 and 10.');
  }

  // validate answer lengths
  const invalidAnswer = questionBody.answers.find(answer => answer.answer.length < ANSWER_MIN_LENGTH || answer.answer.length > ANSWER_MAX_LENGTH);
  if (invalidAnswer) {
    throw HTTPError(400, 'The length of any answer must be between 1 and 30 characters.');
  }

  // check for duplicate answers
  const uniqueAnswers = new Set(questionBody.answers.map(answer => answer.answer));
  if (uniqueAnswers.size !== questionBody.answers.length) {
    throw HTTPError(400, 'Answer strings must be unique within the same question.');
  }

  // check if there is at least one correct answer
  const hasCorrectAnswer = questionBody.answers.some(answer => answer.correct);
  if (!hasCorrectAnswer) {
    throw HTTPError(400, 'There must be at least one correct answer.');
  }

  if (questionBody.thumbnailUrl === '') {
    throw HTTPError(400, 'The thumbnailUrl is an empty string');
  }

  if (!questionBody.thumbnailUrl.endsWith('.jpg') &&
    !questionBody.thumbnailUrl.endsWith('.jpeg') &&
    !questionBody.thumbnailUrl.endsWith('.png')) {
    throw HTTPError(400, 'The thumbnailUrl does not end with jpg, jpeg, png.');
  }

  if (!questionBody.thumbnailUrl.startsWith('http://') &&
    !questionBody.thumbnailUrl.startsWith('https://')) {
    throw HTTPError(400, 'The thumbnailUrl does not begin with http:// or https://');
  }
  // update question elements
  quiz.questions[questionIndex] = questionBody;
  quiz.questions[questionIndex].questionId = questionId;

  // update quiz duration
  quiz.duration = duration;

  // update time last edited
  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;
  setData(data);

  return {};
}

/**
 * Deletes a question from a quiz.
 *
 * @param {string} token - The authentication token.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} questionId - The ID of the question to delete.
 *
 * @returns {Object} - Returns an empty object or an error object.
 */
function adminQuizQuestionDelete(token: string, quizId: number, questionId: number): Record<string, never> {
  // check invalid token
  const data = getData();
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // check valid quizId
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  // check valid questionId
  const question: Question | undefined = getQuestion(quiz, questionId);
  if (!question) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  const questionIndex = quiz.questions.findIndex(idx => idx.questionId === questionId);

  // update duration
  let duration = quiz.questions.reduce((sum, question) => sum + question.duration, 0);
  duration = duration - quiz.questions[questionIndex].duration;

  quiz.duration = duration;

  // remove question from quiz
  quiz.questions.splice(questionIndex, 1);

  // update time last edited
  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;
  setData(data);

  return {};
}

/**
 * Move a question from one particular position in the quiz to another
 *
 * @param {string} token - A unique identifier for user session
 * @param {number} quizId - A unique identifier for quiz id
 * @param {number} questionId - A unique identifier for question id
 * @returns {{}} - An empty object if successful, otherwise returns an ErrorObject
 */
function adminQuizQuestionMove(token: string, quizId: number, questionId: number, newPosition: number): Record<string, never> {
  // get the user
  const data = getData();
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // get the quiz
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  // get the question
  const question: Question | undefined = getQuestion(quiz, questionId);
  if (!question) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  // get the question index
  const currentQuestionIndex = quiz.questions.findIndex(idx => idx.questionId === questionId);

  // check if newPosition is of valid length
  if (newPosition < 0 || newPosition > quiz.questions.length - 1) {
    throw HTTPError(400, 'NewPosition cannot be less than 0 or greater than n-1 where n is the number of questions');
  }

  // check if newPosition is not position of current question
  if (newPosition === currentQuestionIndex) {
    throw HTTPError(400, 'NewPosition is the position of the current question');
  }

  // Remove the question from its current position
  const removedQuestion = quiz.questions.splice(currentQuestionIndex, 1)[0];

  // Insert the question at the new position
  quiz.questions.splice(newPosition, 0, removedQuestion);

  // set the timeLastEdited
  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;
  setData(data);

  return {};
}

/**
 * A question gets duplicated to immediately after where the source question is
 *
 * @param {string} token - The token of the active user.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} questionId - The ID of the question.
 *
 * @returns {{ newQuestionId: number } | { ErrorObject }} - Returns the newQuestionId or an error object.
 */
function adminQuizQuestionDuplicate(token: string, quizId: number, questionId: number): { newQuestionId: number } {
  // get the user
  const data = getData();
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // get the quiz
  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  // get the question
  const question: Question = getQuestion(quiz, questionId);
  if (!question) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  const currentQuestionIndex = quiz.questions.findIndex(idx => idx.questionId === questionId);

  // duplicate the question with a new id
  const newQuestionId = generateUniqueNumberId();
  const newQuestion: Question = {
    questionId: newQuestionId,
    question: question.question,
    answers: question.answers,
    duration: question.duration,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points
  };

  // duplicate must make quiz duration less than three minutes
  if (quiz.duration + question.duration > THREE_MINUTES) {
    throw HTTPError(400, 'The sum of the question durations in the quiz exceeds 3 minutes.');
  }

  // append the duplicated question after the current question
  quiz.questions.splice(currentQuestionIndex + 1, 0, newQuestion);

  // update the timeLastEdited
  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;

  // update the total quiz duration
  quiz.duration += question.duration;
  setData(data);

  return { newQuestionId: newQuestionId };
}

/**
 * Update the thumbnail for the quiz.
 * When this route is called, the timeLastEdited is updated.
 * @param {string} token - The token of the active user.
 * @param {number} quizId - The ID of the quiz.
 * @param {string} imgUrl - The URL link of the image.
 *
 * @returns {{ newQuestionId: number } | { ErrorObject }} - Returns the newQuestionId or an error object.
 */
function adminQuizThumbnailUpdate(token: string, quizId: number, imgUrl: string): Record<string, never> {
  const data = getData();
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'Valid token provided, but quizId is invalid or the user does not own the quiz');
  }

  if (!imgUrl.endsWith('.jpg') && !imgUrl.endsWith('.jpeg') && !imgUrl.endsWith('.png')) {
    throw HTTPError(400, 'The thumbnailUrl does not end with jpg, jpeg, png.');
  }

  if (!imgUrl.startsWith('http://') &&
    !imgUrl.startsWith('https://')) {
    throw HTTPError(400, 'The thumbnailUrl does not begin with http:// or https://');
  }

  quiz.thumbnailUrl = imgUrl;

  const currentTime = Math.floor(Date.now() / ONE_SECOND);
  quiz.timeLastEdited = currentTime;
  setData(data);

  return {};
}

/**
  * Retrieves the quiz session information for a given quiz.
  * @param {string} token - The authentication token of the admin.
  * @param {number} quizId - The ID of the quiz.
  *
  * @returns {QuizSessionInfo} - An object containing the active and inactive session IDs for the quiz.
*/
function adminQuizSessionsView(token: string, quizId: number): QuizSessionInfo {
  const data = getData();

  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'token invalid');
  }

  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'quiz invalid');
  }

  // returns list of session ids for given quiz and state (active or inactive)
  function getStateIds(sessions: QuizSession[], quizId: QuizID, active: boolean): number[] {
    return sessions.filter(s => (s.quizId === quizId) && ((active === true) ? (s.state !== QuizState.END) : (s.state === QuizState.END))).map(s => s.quizSessionId);
  }

  const sessionIds: QuizSessionInfo = {
    activeSessions: getStateIds(data.quizSessions, quiz.quizId, true),
    inactiveSessions: getStateIds(data.quizSessions, quiz.quizId, false),
  };

  return sessionIds;
}

/**
 * Starts a new quiz session for a given quiz.
 * @param {string} token - The authentication token of the admin.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} autoStartNum - The number of players required to automatically start the session.
 *
 * @returns {Object} - An object containing the ID of the newly created session.
*/
function adminQuizSessionStart(token: string, quizId: number, autoStartNum: number): { sessionId: number } {
  const data = getData();

  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'token invalid');
  }

  const quiz: Quiz | undefined = getQuizById(quizId, user);
  const trash: Quiz | undefined = data.trash.find((idx) => idx.quizId === quizId);

  if (!quiz && !trash) {
    throw HTTPError(403, 'quiz invalid');
  }
  if (!quiz && trash) {
    throw HTTPError(400, 'quiz in trash');
  }

  if (quiz.questions.length < 1) {
    throw HTTPError(400, 'no questions in quiz');
  }

  if (autoStartNum > 50) {
    throw HTTPError(400, 'auto start over limit');
  }

  const activeSessions = data.quizSessions.filter(s => s.quizId === quizId && s.state !== QuizState.END);
  if (activeSessions.length > 10) {
    throw HTTPError(400, 'active sessions over limit');
  }

  const quizSession: QuizSession = {
    quizSessionId: generateUniqueNumberId(),
    state: QuizState.LOBBY,
    atQuestion: -1,
    players: [],
    quizId: quiz.quizId,
    autoStartNum: autoStartNum,
    questionStartTimes: [],
    messages: [],
    quizCopy: quiz,
  };

  data.quizSessions.push(quizSession);
  setData(data);

  return { sessionId: quizSession.quizSessionId };
}

/**
 * Updates the state of a quiz session based on the provided action.
 * @param {string} token - The authentication token of the admin.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} sessionId - The ID of the quiz session.
 * @param {QuizAction} action - The action to perform on the session.
 *
 * @returns {Record<string, never>} - An empty object.
*/
function adminQuizSessionState(token: string, quizId: number, sessionId: number, action: QuizAction): Record<string, never> {
  const data = getData();

  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'token invalid');
  }

  const quiz: Quiz | undefined = getQuizById(quizId, user);
  if (!quiz) {
    throw HTTPError(403, 'quiz invalid');
  }

  if (!Object.values(QuizAction).includes(action)) {
    throw HTTPError(400, 'action invalid');
  }

  // returns list of session ids for given quiz and state (active or inactive)
  function getSessionsActive(sessions: QuizSession[], quizId: QuizID): number[] {
    return sessions
      .filter(s => (s.quizId === quizId) && s.state !== QuizState.END)
      .map(s => s.quizSessionId);
  }

  // helper function to start question countdown
  function startQuestionCountdown() {
    // set the session state
    session.state = QuizState.QUESTION_COUNTDOWN;

    // create a three second timer for state to transition
    session.questionTimerHandler = setTimeout(() => {
      // set the session state
      session.state = QuizState.QUESTION_OPEN;
      // set the start time of the question
      session.questionStartTimes[session.atQuestion] = Math.floor(Date.now() / ONE_SECOND);
      // immediately start the question timer
      startQuestionTimer();
    }, THREE_SECONDS);
  }

  // helper function to start question duration timer
  function startQuestionTimer() {
    const questionDuration = quiz.questions[session.atQuestion].duration * ONE_SECOND;

    // set a timeout to transition to after question duration
    session.questionTimerHandler = setTimeout(() => {
      session.state = QuizState.QUESTION_CLOSE;
    }, questionDuration);
  }

  if (!getSessionsActive(data.quizSessions, quiz.quizId).includes(sessionId)) {
    throw HTTPError(400, 'session invalid');
  }

  const session = data.quizSessions.find(idx => idx.quizSessionId === sessionId);

  if (session.state === QuizState.LOBBY) {
    if (action === QuizAction.NEXT_QUESTION) {
      session.atQuestion++;
      startQuestionCountdown();
    } else if (action === QuizAction.END) {
      session.state = QuizState.END;
    } else {
      throw HTTPError(400, 'invalid action');
    }
  } else if (session.state === QuizState.QUESTION_COUNTDOWN) {
    if (action === QuizAction.END) {
      session.state = QuizState.END;
      clearTimeout(session.questionTimerHandler);
    } else if (action === QuizAction.SKIP_COUNTDOWN) {
      // reassign the start time
      session.questionStartTimes[session.atQuestion] = Math.floor(Date.now() / ONE_SECOND);
      // set the session state
      session.state = QuizState.QUESTION_OPEN;
      // clear the countdown timer
      clearTimeout(session.questionTimerHandler);
      // start the question timer
      startQuestionTimer();
    } else {
      throw HTTPError(400, 'invalid action');
    }
  } else if (session.state === QuizState.QUESTION_OPEN) {
    if (action === QuizAction.END) {
      session.state = QuizState.END;
      clearTimeout(session.questionTimerHandler);
    } else if (action === QuizAction.GO_TO_ANSWER) {
      session.state = QuizState.ANSWER_SHOW;
    } else {
      throw HTTPError(400, 'invalid action');
    }
  } else if (session.state === QuizState.QUESTION_CLOSE) {
    if (action === QuizAction.END) {
      clearTimeout(session.questionTimerHandler);
      session.state = QuizState.END;
    } else if (action === QuizAction.GO_TO_ANSWER) {
      session.state = QuizState.ANSWER_SHOW;
    } else if (action === QuizAction.NEXT_QUESTION) {
      session.atQuestion++;
      startQuestionCountdown();
    } else if (action === QuizAction.GO_TO_FINAL_RESULTS) {
      clearTimeout(session.questionTimerHandler);
      session.state = QuizState.FINAL_RESULTS;
    } else {
      throw HTTPError(400, 'invalid action');
    }
  } else if (session.state === QuizState.ANSWER_SHOW) {
    if (action === QuizAction.END) {
      clearTimeout(session.questionTimerHandler);
      session.state = QuizState.END;
    } else if (action === QuizAction.NEXT_QUESTION) {
      session.atQuestion++;
      startQuestionCountdown();
    } else if (action === QuizAction.GO_TO_FINAL_RESULTS) {
      clearTimeout(session.questionTimerHandler);
      session.state = QuizState.FINAL_RESULTS;
    } else {
      throw HTTPError(400, 'invalid action');
    }
  } else {
    if (action === QuizAction.END) {
      session.state = QuizState.END;
    } else {
      throw HTTPError(400, 'invalid action');
    }
  }

  setData(data);
  return {};
}

/**
 * Retrieves the status of a quiz session.
 * @param {string} token - The authentication token of the admin.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} sessionId - The ID of the quiz session.
 *
 * @returns {QuizSessionStatus} - An object containing the current state, question number, player info and metadata
*/
function adminQuizSessionStatus(token: string, quizId: number, sessionId: number): QuizSessionStatus {
  // Check if the token is valid and refers to a logged-in user session
  const user = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Invalid token');
  }

  // Find the quiz based on the provided quizId
  const quiz = getData().quizzes.find(q => q.quizId === quizId);
  if (!quiz) {
    throw HTTPError(400, 'Invalid quiz ID');
  }

  // Check if the user is the owner of the quiz
  if (quiz.ownerId !== user.authUserId) {
    throw HTTPError(403, 'User is not the owner of the quiz');
  }

  // Find the quiz session based on the provided sessionId
  const quizSession = getData().quizSessions.find(session => session.quizSessionId === sessionId);
  if (!quizSession) {
    throw HTTPError(400, 'Invalid session ID');
  }

  const players: string[] = getData().activePlayers.filter(
    activePlayer => quizSession.players.includes(activePlayer.playerId))
    .map(activePlayer => activePlayer.name);

  // Prepare the response object
  const response: QuizSessionStatus = {
    state: quizSession.state,
    atQuestion: quizSession.atQuestion,
    players: players,
    metadata: {
      quizInfo: adminQuizInfo(token, quizId)
    }
  };

  return response;
}

/**
 * Retrieves the results of a quiz session.
 * @param {string} token - The authentication token of the admin.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} sessionId - The ID of the quiz session.
 *
 * @returns {QuizResults} - An object containing the ranked scores of users and the results of each question.
*/
function adminQuizSessionResults(token: string, quizId: number, sessionId: number): QuizResults {
  const data = getData();

  // Check if the token is valid and refers to a logged-in user session
  const user = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Invalid token');
  }

  // Find the quiz based on the provided quizId
  const quiz = getData().quizzes.find(q => q.quizId === quizId);
  if (!quiz) {
    throw HTTPError(400, 'Invalid quiz ID');
  }

  // Check if the user is the owner of the quiz
  if (quiz.ownerId !== user.authUserId) {
    throw HTTPError(403, 'User is not the owner of the quiz');
  }

  // Find the quiz session based on the provided sessionId
  const quizSession = getData().quizSessions.find(session => session.quizSessionId === sessionId);
  if (!quizSession) {
    throw HTTPError(400, 'Invalid session ID');
  }

  // Check if the session is in the FINAL_RESULTS state
  if (quizSession.state !== QuizState.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  // Get other players in the session
  const players: Player[] = data.activePlayers.filter(
    activePlayer => quizSession.players.includes(activePlayer.playerId)
  );
  // Initialise a scores array of the length of the total number of session players
  const scores: number[] = new Array(quizSession.players.length).fill(0);
  // Make the QuestionResult array
  const questionResults: QuestionResult[] = [];

  for (let i = 0; i < quiz.questions.length; i++) {
    const result = playerQuestionResultsHelper(quizSession, quiz.questions[i], i, scores, []);
    questionResults.push(result);
  }

  // Sort players by score
  const usersRankedByScore = scores
    .map((score, index) => ({ name: players[index].name, score }));

  return { usersRankedByScore, questionResults };
}

/**
 * Generates a CSV file with the results of a quiz session and provides a download link.
 * @param {string} token - The authentication token of the admin.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} sessionId - The ID of the quiz session.
 *
 * @returns {Object} - An object containing the URL of the generated CSV file.
*/
function adminQuizSessionResultsLink(token: string, quizId: number, sessionId: number): { url: string } {
  const data = getData();

  // Check if the token is valid and refers to a logged-in user session
  const user = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Invalid token');
  }

  // Find the quiz based on the provided quizId
  const quiz = getData().quizzes.find(q => q.quizId === quizId);
  if (!quiz) {
    throw HTTPError(403, 'Invalid quiz ID');
  }

  // Check if the user is the owner of the quiz
  if (quiz.ownerId !== user.authUserId) {
    throw HTTPError(403, 'User is not the owner of the quiz');
  }

  // Find the quiz session based on the provided sessionId
  const quizSession = getData().quizSessions.find(session => session.quizSessionId === sessionId);
  if (!quizSession) {
    throw HTTPError(400, 'Invalid session ID');
  }

  // Check if the session is in the FINAL_RESULTS state
  if (quizSession.state !== QuizState.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  // Get other players in the session
  const players: Player[] = data.activePlayers.filter(
    activePlayer => quizSession.players.includes(activePlayer.playerId)
  );
  // Initialise a scores array of the length of the total number of session players
  const scores: number[] = new Array(quizSession.players.length).fill(0);

  const quizRankings: number[][] = Array.from({ length: quiz.questions.length }, () => new Array(quizSession.players.length).fill(0));

  for (let i = 0; i < quiz.questions.length; i++) {
    const questionRankings: number[] = [];
    playerQuestionResultsHelper(quizSession, quiz.questions[i], i, scores, questionRankings);

    // Set the rankings of each question
    for (let j = 0; j < questionRankings.length; j++) {
      quizRankings[i][questionRankings[j]] = j + 1;
    }
  }

  let csvString = '';
  for (let i = 0; i < players.length; i++) {
    csvString += players[i].name;
    for (let j = 0; j < quiz.questions.length; j++) {
      let score = 0;
      if (quizRankings[j][i] !== 0) {
        score = 1 / quizRankings[j][i] * quiz.questions[j].points;
      }
      // Write the score and ranking for question j
      csvString += `, ${score}, ${quizRankings[j][i]}`;
    }
    csvString += '\n';
  }
  const fs = require('fs');

  // Check if 'public' directory exists, if not, create it
  if (!fs.existsSync('public')) {
    mkdirSync('public');
  }
  writeFileSync(`public/quiz_final_results_${quizSession.quizSessionId}.csv`, csvString);

  return {
    url: `http://localhost:42424/quiz_final_results_${quizSession.quizSessionId}.csv`
  };
}

export {
  adminQuizCreate, adminQuizList, adminQuizInfo, adminQuizRemove,
  adminQuizTrashView, adminQuizTrashRestore, adminQuizTrashEmpty,
  adminQuizTransferOwner, adminQuizQuestionCreate, adminQuizQuestionUpdate,
  adminQuizQuestionDelete, adminQuizQuestionMove, adminQuizQuestionDuplicate,
  adminQuizThumbnailUpdate, adminQuizSessionsView, adminQuizSessionStart,
  adminQuizSessionResultsLink, adminQuizSessionResults, adminQuizSessionStatus,
  adminQuizSessionState
};
