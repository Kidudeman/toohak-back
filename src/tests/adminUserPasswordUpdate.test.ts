// testing for adminUserPasswordUpdate that checks for the validity and changes the users pasword.

import { requestAdminAuthRegister, requestAdminUserPasswordUpdate, requestClear } from './requests';
const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };

let user: {token: string};
beforeEach(() => {
  requestClear();
  user = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
});

test('valid AuthId, valid old password, new pass is unique, more than 8 characters, one number and one letter ', () => {
  const UserPasswordUpdate = requestAdminUserPasswordUpdate(user.token, 'testPassword001', 'NewPassword001');
  expect(UserPasswordUpdate).toEqual({});
});

describe('adminUserPasswordUpdate - issue with User', () => {
  test('invalid UserId', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    const UserPasswordUpdate = requestAdminUserPasswordUpdate((invalidToken), 'testPassword001', 'NewPassword001');
    expect(UserPasswordUpdate).toEqual(ERROR401);
  });
});

describe('adminUserPasswordUpdate - invalid password input', () => {
  test('invalid password choice - no numbers', () => {
    const UserPasswordUpdate = requestAdminUserPasswordUpdate(user.token, 'testPassword001', 'BadPass');
    expect(UserPasswordUpdate).toEqual(ERROR400);
  });

  test('invalid password choice - no letters', () => {
    const noLetters = requestAdminUserPasswordUpdate(user.token, 'testPassword001', '172946372812');
    expect(noLetters).toEqual(ERROR400);
  });

  test('invalid password choice - less than 8 characters', () => {
    const tooShort = requestAdminUserPasswordUpdate(user.token, 'testPassword001', 'Bad123');
    expect(tooShort).toEqual(ERROR400);
  });

  test('Incorrect old password', () => {
    expect(requestAdminUserPasswordUpdate(user.token, 'testPassword002', 'NewPassword001')).toStrictEqual(ERROR400);
  });

  test('new password and old password are the same', () => {
    expect(requestAdminUserPasswordUpdate(user.token, 'testPassword001', 'testPassword001')).toStrictEqual(ERROR400);
  });

  test('new password is an old password', () => {
    expect(requestAdminUserPasswordUpdate(user.token, 'testPassword001', 'NewPassword001')).toStrictEqual({});
    expect(requestAdminUserPasswordUpdate(user.token, 'NewPassword001', 'testPassword001')).toStrictEqual(ERROR400);
  });
});
