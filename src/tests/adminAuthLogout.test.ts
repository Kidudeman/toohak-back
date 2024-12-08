import { requestAdminAuthRegister, requestAdminAuthLogin, requestAdminAuthLogout, requestClear } from './requests';

const ERROR401 = { error: expect.any(String), status: 401 };

let invalidUserLogin1: { token: string };
let validUserLogin2: { token: string };

let user1: { token: string };
let user2: { token: string};

beforeEach(() => {
  requestClear();
  user1 = requestAdminAuthRegister('valid.test@gmail.com', 'TestPassword1!', 'FirstName', 'LastName');
});

describe('requestAdminAuthLogout - Valid token', () => {
  test('valid case - Register token is valid', () => {
    expect(requestAdminAuthLogout(user1.token)).toStrictEqual({});
  });

  test('valid case - Login token is valid', () => {
    user2 = requestAdminAuthRegister('new.login@gmail.com', '2ndtestLogin!', 'Pierre', 'Nguyen');
    requestAdminAuthLogout(user2.token);

    validUserLogin2 = requestAdminAuthLogin('new.login@gmail.com', '2ndtestLogin!');
    expect(requestAdminAuthLogout(validUserLogin2.token)).toStrictEqual({});
  });
});

describe('requestAdminAuthLogout - Invalid token', () => {
  test('Invalid case - Token is invalid (does not refer to valid logged in user quiz session)', () => {
    invalidUserLogin1 = requestAdminAuthLogin('notVALID.test@gmail.com', 'TestPassword1!');
    expect(requestAdminAuthLogout(invalidUserLogin1.token)).toStrictEqual(ERROR401);
  });

  test('Invalid case - Token is empty (does not refer to valid logged in user quiz session)', () => {
    expect(requestAdminAuthLogout('')).toStrictEqual(ERROR401);
  });
});
