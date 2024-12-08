import { requestAdminAuthRegister, requestClear } from './requests';

const ERROR400 = { error: expect.any(String), status: 400 };
const TOKEN000 = { token: expect.stringMatching(/^\d+$/) };

beforeEach(() => {
  requestClear();
});

describe('adminAuthRegister - success', () => {
  test('valid case', () => {
    expect(requestAdminAuthRegister('me@gmail.com', 'Password1', 'first', 'last')).toStrictEqual(TOKEN000);
  });
});

describe('adminAuthRegister - failure', () => {
  test('existing user', () => {
    requestAdminAuthRegister('me@gmail.com', 'Password1-', 'first-', 'last-');
    expect(requestAdminAuthRegister('me@gmail.com', 'Password1', 'first', 'last')).toStrictEqual(ERROR400);
  });

  test.each([
    { test: 'bad form - dependency function', email: '@gmail.com', password: 'Password1!', nameFirst: 'Maddie', nameLast: 'Marum' },
    { test: 'bad form - dependency function', email: 'mm @ gmail.com', password: 'Password1!', nameFirst: 'Maddie', nameLast: 'Marum' },
    { test: 'bad form - dependency function', email: 'mm@gmail', password: 'Password1!', nameFirst: 'Maddie', nameLast: 'Marum' },
    { test: 'bad form - dependency function', email: 'mememe.com', password: 'Password1!', nameFirst: 'Maddie', nameLast: 'Marum' },
    { test: 'bad form - dependency function', email: 'm@.org', password: 'Password1!', nameFirst: 'Maddie', nameLast: 'Marum' },
  ])('invalid email', ({ email, password, nameFirst, nameLast }) => {
    expect(requestAdminAuthRegister(email, password, nameFirst, nameLast)).toStrictEqual(ERROR400);
  });

  test.each([
    { test: 'too short - else good', email: 'mm@gmail.com', password: 'pw0', nameFirst: 'Maddie', nameLast: 'Marum' },
    { test: 'bad regex - no letter', email: 'mm@gmail.com', password: '1!1!1!1!1!', nameFirst: 'Maddie', nameLast: 'Marum' },
    { test: 'bad regex - no number', email: 'mm@gmail.com', password: 'password', nameFirst: 'Maddie', nameLast: 'Marum' },
    { test: 'bad regex - no number', email: 'mm@gmail.com', password: 'PASSWORD', nameFirst: 'Maddie', nameLast: 'Marum' },
    { test: 'bad regex - no number', email: 'mm@gmail.com', password: '***pw***', nameFirst: 'Maddie', nameLast: 'Marum' },
  ])('invalid password', ({ email, password, nameFirst, nameLast }) => {
    expect(requestAdminAuthRegister(email, password, nameFirst, nameLast)).toStrictEqual(ERROR400);
  });

  test.each([
    { test: 'too short - first', email: 'mm@gmail.com', password: 'Password1!', nameFirst: 'M', nameLast: 'Marum' },
    { test: 'too long - last', email: 'mm@gmail.com', password: 'Password1!', nameFirst: 'Maddie', nameLast: 'Marum'.repeat(5) },
    { test: 'bad regex - first', email: 'mm@gmail.com', password: 'Password1!', nameFirst: 'Madd1e', nameLast: 'Marum' },
    { test: 'bad regex - last', email: 'mm@gmail.com', password: 'Password1!', nameFirst: 'Maddie', nameLast: 'M@rum' },
    { test: 'bad regex - both', email: 'mm@gmail.com', password: 'Password1!', nameFirst: '*Maddie', nameLast: 'Marum*' },
  ])('invalid name', ({ email, password, nameFirst, nameLast }) => {
    expect(requestAdminAuthRegister(email, password, nameFirst, nameLast)).toStrictEqual(ERROR400);
  });

  test('missing arguments', () => {
    expect(requestAdminAuthRegister('', '', '', '')).toStrictEqual(ERROR400);
  });
});
