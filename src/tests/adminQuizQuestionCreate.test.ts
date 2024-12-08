import { requestAdminAuthRegister, requestAdminQuizCreate, requestAdminQuizQuestionCreate, requestClear, requestAdminQuizInfo } from './requests';

const TOKEN_ERROR = { error: expect.any(String), status: 401 };
const QUIZ_ERROR = { error: expect.any(String), status: 403 };
const QUESTION_ERROR = { error: expect.any(String), status: 400 };

let user: { token: string };
let quiz: { quizId: number };

beforeEach(() => {
  requestClear();
  user = requestAdminAuthRegister('test.example@gmail.com', 'test!1Example', 'amit', 'kumar');
  quiz = requestAdminQuizCreate(user.token, 'Quiz', 'description');
});

describe('adminQuizQuestionCreate', () => {
  // Test when token is empty or invalid
  test('empty or invalid token', () => {
    expect(requestAdminQuizQuestionCreate('', quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(TOKEN_ERROR);
    expect(requestAdminQuizQuestionCreate('invalidToken', quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(TOKEN_ERROR);
  });

  // Test when quiz ID is invalid or user does not own the quiz
  test('invalid quiz ID or user does not own the quiz', () => {
    expect(requestAdminQuizQuestionCreate(user.token, 999, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUIZ_ERROR);

    const anotherUser = requestAdminAuthRegister('another@example.com', 'password123', 'Another', 'User');
    expect(requestAdminQuizQuestionCreate(anotherUser.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUIZ_ERROR);
  });

  // Test when question string is less than 5 characters or greater than 50 characters
  test('invalid question string length', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Q', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Q'.repeat(51), answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // Test when the question has more than 6 answers or less than 2 answers
  test('invalid number of answers', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: Array(7).fill({ answer: 'Answer', correct: true }), duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // Test when the question duration is not a positive number
  test('invalid question duration', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 0, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: -60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // Test when the sum of question durations in the quiz exceeds 3 minutes
  test('total question duration exceeds 3 minutes', () => {
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question 1', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 120, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' });
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question 2', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 61, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // Test when the points awarded for the question are less than 1 or greater than 10
  test('invalid question points', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 0, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 11, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // Test when the length of any answer is shorter than 1 character or longer than 30 characters
  test('invalid answer length', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: '', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'A'.repeat(31), correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // Test when any answer strings are duplicates within the same question
  test('duplicate answer strings', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer', correct: true }, { answer: 'Answer', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // Test when there are no correct answers
  test('no correct answers', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: false }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // The thumbnailUrl is an empty string
  test('The thumbnailUrl is an empty string', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: '' })).toStrictEqual(QUESTION_ERROR);
  });

  // The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png
  test('The thumbnailUrl does not end with jpg, jpeg, png', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'http://google.com/some/image/path.asd' })).toStrictEqual(QUESTION_ERROR);
  });

  // The thumbnailUrl does not begin with 'http://' or 'https://'
  test('The thumbnailUrl does not begin with http:// or https://', () => {
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 20, points: 5, thumbnailUrl: 'http:/google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
    expect(requestAdminQuizQuestionCreate(user.token, quiz.quizId, { question: 'Question', answers: [{ answer: 'Answer 1', correct: true }, { answer: 'Answer 2', correct: false }], duration: 60, points: 5, thumbnailUrl: 'https:/google.com/some/image/path.jpg' })).toStrictEqual(QUESTION_ERROR);
  });

  // Test with valid parameters
  test('valid parameters', () => {
    const questionBody = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'London', correct: false },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 30,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const result = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    expect(result).toHaveProperty('questionId');
    expect(typeof result.questionId).toBe('number');

    // Check if the question creation is valid using adminQuizInfo
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    expect(quizInfo).toHaveProperty('quizId', quiz.quizId);
    expect(quizInfo).toHaveProperty('name', 'Quiz');
    expect(quizInfo).toHaveProperty('description', 'description');
    expect(quizInfo).toHaveProperty('duration', questionBody.duration);
    expect(quizInfo).toHaveProperty('numQuestions', 1);
    expect(quizInfo.questions).toHaveLength(1);
    expect(quizInfo.questions[0]).toMatchObject({
      questionId: result.questionId,
      question: questionBody.question,
      duration: questionBody.duration,
      points: questionBody.points
    });
    expect(quizInfo.questions[0].answers).toHaveLength(4);
    expect(quizInfo.questions[0].answers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ answer: 'Paris', correct: true }),
        expect.objectContaining({ answer: 'London', correct: false }),
        expect.objectContaining({ answer: 'Berlin', correct: false }),
        expect.objectContaining({ answer: 'Madrid', correct: false })
      ])
    );
    expect(quizInfo.questions[0]).toHaveProperty('thumbnailUrl', questionBody.thumbnailUrl);
    expect(quizInfo).toHaveProperty('thumbnailUrl', '');
  });
});
