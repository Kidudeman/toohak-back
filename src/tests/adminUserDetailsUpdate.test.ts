import { requestAdminAuthRegister, requestAdminUserDetailsUpdate, requestClear } from './requests';
const ERROR400 = { error: expect.any(String), status: 400 };
const ERROR401 = { error: expect.any(String), status: 401 };

let user1: {token: string};

beforeEach(() => {
  requestClear();
  user1 = requestAdminAuthRegister('test.example@gmail.com', 'testPassword001', 'FirstName', 'LastName');
});

describe('valid Names adminUserDetailsUpdate', () => {
  test('valid first+last name, unique email and userId', () => {
    expect(requestAdminUserDetailsUpdate(user1.token, 'uniqueEmail@gmail.com', 'FirstName', 'LastName')).toEqual({});
  });

  test('valid first+last name, not unique email', () => {
    expect(requestAdminUserDetailsUpdate(user1.token, 'test.example@gmail.com', 'FirstName', 'LastName')).toEqual({});
  });
});

describe('invalid names', () => {
  test.each([
    { test: 'Invalid: Name contains prohibited characters ', nameFirst: '==``~~~=}{', nameLast: 'goodname' },
    { test: 'Invalid: first name - not enough characters', nameFirst: 'P', nameLast: 'nicename' },
    { test: 'Invalid: last name - not enough characters', nameLast: 'P', nameFirst: 'enoughletters' },
    { test: 'Invalid: first name - exceeds 20 characters', nameFirst: 'aaaaa'.repeat(5), nameLast: 'nguyen' },
    { test: 'Invalid: last name - exceeds 20 chracters', nameLast: 'ppppp'.repeat(5), nameFirst: 'pierre' },
  ])('Invalid name choices', ({ nameFirst, nameLast }) => {
    expect(requestAdminUserDetailsUpdate(user1.token, 'uniqueEmail@gmail.com', nameFirst, nameLast)).toEqual(ERROR400);
  });
});

describe('adminUserDetailsUpdate invalid userId', () => {
  test('invalid authUserId - not a valid user', () => {
    const invalidToken = (-parseInt(user1.token)).toString();
    expect(requestAdminUserDetailsUpdate((invalidToken), 'test.examp1le@gmail.com', 'FirstName', 'LastName')).toEqual(ERROR401);
  });
});

describe('invalid email', () => {
  test('invalid email format trying to be updated', () => {
    expect(requestAdminUserDetailsUpdate(user1.token, 'invalidemail@@', 'firstName', 'LastName')).toEqual(ERROR400);
  });

  test('email used by another user', () => {
    const testValid2 = requestAdminAuthRegister('12345different@gmail.com', 'testPassword001', 'First', 'Last');
    expect(requestAdminUserDetailsUpdate(testValid2.token, 'test.example@gmail.com', 'FirstName', 'LastName')).toEqual(ERROR400);
  });
});
