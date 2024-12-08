import { requestAdminAuthRegister, requestAdminUserDetails, requestClear } from './requests';
const ERROR401 = { error: expect.any(String), status: 401 };

let user: {token: string};
beforeEach(() => {
  requestClear();
  user = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
});

describe('adminUserDetails valid', () => {
  test('valid AuthUserID ', () => {
    expect(requestAdminUserDetails(user.token)).toEqual({
      user:
      {
        userId: expect.any(Number),
        name: 'FirstName' + ' ' + 'LastName',
        email: 'test.example@gmail.com',
        numSuccessfulLogins: expect.any(Number),
        numFailedPasswordsSinceLastLogin: expect.any(Number),
      }

    });
  });
});

describe('adminUserDetails invalid', () => {
  test('invalid authUserId - not a valid user', () => {
    const invalidToken = (-parseInt(user.token)).toString();
    expect(requestAdminUserDetails(invalidToken)).toEqual(ERROR401);
  });
});
