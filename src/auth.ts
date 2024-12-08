import isEmail from 'validator/lib/isEmail';
import { getData, setData } from './dataStore';
import { User, UserDetails } from './types';
import {
  generateToken, generateUniqueNumberId, getHashOf, getUserByToken,
  stringifyToken
} from './helpers';
import HTTPError from 'http-errors';

const NAME_LEN_MIN = 2;
const NAME_LEN_MAX = 20;
const PASS_LEN_MIN = 8;

/**
 * Registers a new admin user with authentication.
 *
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @param {string} nameFirst - The first name of the user.
 * @param {string} nameLast - The last name of the user.
 *
 * @returns {Object} - Returns an object with the authentication user ID.
 */
export function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): { token: string } {
  const data = getData();

  if (!email || !password || !nameFirst || !nameLast) {
    throw HTTPError(400, 'Missing arguments.');
  }

  // name must contain only letters, hyphens, apostrophes, spaces
  const regexName = /^[A-Za-z-' ]+$/;

  // password must contain a number and a letter
  const regexPass = /(?=.*[0-9])(?=.*[a-zA-Z])/;

  if (nameFirst.length < NAME_LEN_MIN || nameFirst.length > NAME_LEN_MAX ||
    nameLast.length < NAME_LEN_MIN || nameLast.length > NAME_LEN_MAX) {
    throw HTTPError(400, 'Invalid name.');
  }

  if (!regexName.test(nameFirst) || !regexName.test(nameLast)) {
    throw HTTPError(400, 'Invalid name.');
  }

  if (password.length < 8 || !regexPass.test(password)) {
    throw HTTPError(400, 'Invalid password.');
  }

  if (!isEmail(String(email))) {
    throw HTTPError(400, 'Invalid email.');
  }

  let user = data.users.find((idx) => idx.email === email);
  if (user) {
    throw HTTPError(400, 'Existing user.');
  }

  // formulates unique sixteen digit integer for user id
  const uuid = generateUniqueNumberId();

  // generates a new token
  const token = generateToken(uuid);

  user = {
    authUserId: uuid,
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
    password: getHashOf(password),
    successfulLogins: 1,
    failedLogins: 0,
    oldPasswords: [],
    quizList: [],
  };

  data.users.push(user);
  setData(data);

  return {
    token: stringifyToken(token),
  };
}

/**
 * Logs in an admin user with authentication.
 *
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 *
 * @returns {Object} - Returns an object with the authentication user ID.
 */
export function adminAuthLogin(email: string, password: string): { token: string } {
  const data = getData();

  if (!email || !password) {
    throw HTTPError(400, 'Missing arguments.');
  }

  const user = data.users.find((idx) => idx.email === email);
  if (!user) {
    throw HTTPError(400, 'Invalid email.');
  }

  if (user.password !== getHashOf(password)) {
    user.failedLogins++;
    throw HTTPError(400, 'Invalid password.');
  }

  // if logged out use the authUserId
  const token = generateToken(user.authUserId);

  user.failedLogins = 0;
  user.successfulLogins++;
  setData(data);

  return {
    token: stringifyToken(token),
  };
}

/**
 * Logs out an admin user with active quiz session.
 *
 * @param {string} token - The token of the active user.
 *
 * @returns {Object} - Returns an empty object.
 */
export function adminAuthLogout(token: string): Record<string, never> {
  const data = getData();
  const activeUserIndex = data.activeUsers.findIndex(user => user.token.sessionId.toString() === token);

  if (activeUserIndex === -1) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // splice the activeUser from the activeUser array when they log out
  data.activeUsers.splice(activeUserIndex, 1);
  setData(data);

  return {};
}

/**
 * Retrieves details of an admin user.
 *
 * @param {string} token- The token of the active user.
 *
 * @returns {Object} - Returns an object with user details.
 */
export function adminUserDetails(token: string): { user: UserDetails } {
  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  return {
    user: {
      userId: user.authUserId,
      name: `${user.nameFirst} ${user.nameLast}`,
      email: user.email,
      numSuccessfulLogins: user.successfulLogins,
      numFailedPasswordsSinceLastLogin: user.failedLogins,
    }
  };
}

/**
 * Updates the details of an admin user.
 *
 * @param {string} token- The token of the active user.
 * @param {string} email - The email of the user.
 * @param {string} nameFirst - The first name of the user.
 * @param {string} nameLast - The last name of the user.
 *
 * @returns {Object} - An object indicating the success/failure.
 */
export function adminUserDetailsUpdate(token: string, email: string, nameFirst: string, nameLast: string): Record<string, never> {
  const data = getData();

  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  // NameFirst and NameLast cannot be less than 2 characters or more than 20 characters
  if (nameFirst.length < NAME_LEN_MIN || nameFirst.length > NAME_LEN_MAX ||
    nameLast.length < NAME_LEN_MIN || nameLast.length > NAME_LEN_MAX) {
    throw HTTPError(400, 'Invalid name.');
  }

  // If the email is not the same as the current email
  if (user.email !== email) {
    const unique = data.users.find(user => user.email === email);
    // If the email is already used
    if (unique && unique !== user) {
      throw HTTPError(400, 'Email already in use.');
    }
  }

  // Check valid email
  if (!isEmail(String(email))) {
    throw HTTPError(400, 'Invalid email.');
  }

  // Check if name first or name last contains characters other than letters or numbers
  const regexName = /^[A-Za-z-' ]+$/;
  if (!regexName.test(nameFirst) || !regexName.test(nameLast)) {
    throw HTTPError(400, 'Invalid name.');
  }

  user.nameFirst = nameFirst;
  user.nameLast = nameLast;
  user.email = email;
  setData(data);

  return {};
}

/**
 * Updates the password of an admin user.
 *
 * @param {string} token- The token of the active user.
 * @param {string} oldPassword - The old password of the admin user.
 * @param {string} newPassword - The new password of the admin user.
 *
 * @returns {Object} - An object indicating the success/failure.
 */
export function adminUserPasswordUpdate(token: string, oldPassword: string, newPassword: string): Record<string, never> {
  const data = getData();

  const user: User | undefined = getUserByToken(token);
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  if (getHashOf(oldPassword) !== user.password) {
    throw HTTPError(400, 'Incorrect old password');
  }

  if (oldPassword === newPassword) {
    throw HTTPError(400, 'New password and old password are the same.');
  }

  if (user.oldPasswords.includes(getHashOf(newPassword))) {
    throw HTTPError(400, 'New password must not be an old password.');
  }

  if (newPassword.length < PASS_LEN_MIN) {
    throw HTTPError(400, 'New password is invalid.');
  }

  if (!(/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword))) {
    throw HTTPError(400, 'New password is invalid.');
  }
  user.password = getHashOf(newPassword);
  user.oldPasswords.push(getHashOf(oldPassword));
  setData(data);
  return {};
}
