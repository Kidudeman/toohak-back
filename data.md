```javascript

let data = {
  users: [
    {
      authUserId: 1,
      nameFirst: 'Dream',
      nameLast: 'Team',
      email: 'dreamteam@gmail.com',
      password: 'dreamteam!',
      successfulLogins: 3,
      failedLogins: 1,
      oldPasswords: ['abc', 'xyz'], 
      quizList: [1,2,3,4],
    },
  ],

  quizzes: [
    {
      quizId: 1531,
      creatorId: 90, 
      quizName: 'COMP1531 Content Revision',
      description: 'Test your knowledge of Software Engineering Fundamentals!',
      timeCreated: 42424242,
      timeLastEdited: 23232323,
      playerIds: [10, 20, 30, 40, 50],
      numQuestions: 42,

      questions: [
        {
          questionNum: 1,
          questionText: 'What is Node.js?',
          options: [
            {
              optionId: 2, 
              optionText: 'Boo',
              isCorrect: false, 
            },
          ],
          timeLimit: 100,
          totalMarks: 3,
        },
      ],
    },
  ],
};

```

This JavaScript data structure contains information about users and quizzes. Each user entry includes authentication details and login information, while each quiz entry includes the creator id, quiz name and description, associated player ids, as well as fields consisting of questions and answer options, etc.
