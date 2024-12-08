import { requestAdminAuthRegister, requestAdminAuthLogin, requestClear } from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const TOKEN000 = { token: expect.stringMatching(/^\d+$/) };

beforeEach(() => {
  requestClear();
  requestAdminAuthRegister('me@gmail.com', 'Password1!', 'First', 'Last');
});

describe('adminAuthLogin - success', () => {
  test('valid case', () => {
    expect(requestAdminAuthLogin('me@gmail.com', 'Password1!')).toStrictEqual(TOKEN000);
  });
});

describe('adminAuthLogin - failure', () => {
  test('incorrect email', () => {
    expect(requestAdminAuthLogin('me@gmail.com.', 'Password1!')).toStrictEqual(ERROR400);
  });

  test('incorrect password', () => {
    expect(requestAdminAuthLogin('me@gmail.com', 'password1!')).toStrictEqual(ERROR400);
  });

  test('missing arguments', () => {
    expect(requestAdminAuthLogin(' ', ' ')).toStrictEqual(ERROR400);
  });

  test('missing arguments', () => {
    expect(requestAdminAuthLogin('', '')).toStrictEqual(ERROR400);
  });
});
