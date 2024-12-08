import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import {
  adminAuthLogin, adminAuthLogout, adminAuthRegister, adminUserDetails,
  adminUserDetailsUpdate, adminUserPasswordUpdate
} from './auth';
import {
  adminQuizCreate, adminQuizDescriptionUpdate, adminQuizInfo,
  adminQuizList, adminQuizNameUpdate, adminQuizRemove, adminQuizTrashView,
  adminQuizTrashRestore, adminQuizTrashEmpty, adminQuizTransferOwner,
  adminQuizQuestionCreate, adminQuizQuestionUpdate, adminQuizQuestionDelete,
  adminQuizQuestionMove, adminQuizQuestionDuplicate,
  adminQuizThumbnailUpdate,
  adminQuizSessionsView,
  adminQuizSessionStart,
  adminQuizSessionState,
  adminQuizSessionStatus,
  adminQuizSessionResults,
  adminQuizSessionResultsLink
} from './quiz';
import { clear } from './other';
import { saveDataStore, loadDataStore } from './dataStore';
import { playerQuestionAnswer, playerQuestionInfo, playerQuestionResults, playerSessionChatSend, playerSessionChatView, playerSessionJoin, playerSessionResults, playerSessionStatus } from './player';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: 'list' } }));
app.use(express.static('public'));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;

  const response = adminAuthRegister(email, password, nameFirst, nameLast);
  res.json(response);
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  const response = adminAuthLogin(email, password);

  res.json(response);
});

app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response = adminUserDetails(token);

  res.json(response);
});

app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { email, nameFirst, nameLast } = req.body;

  const response = adminUserDetailsUpdate(token, email, nameFirst, nameLast);

  res.json(response);
});

app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { oldPassword, newPassword } = req.body;

  const response = adminUserPasswordUpdate(token, oldPassword, newPassword);
  res.json(response);
});

// Lists all the user's quizzes
app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response = adminQuizList(token);

  res.json(response);
});

// Create a new quiz
app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { name, description } = req.body;

  const response = adminQuizCreate(token, name, description);

  res.json(response);
});

app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;

  const response = adminQuizRemove(token, quizId);

  res.json(response);
});

app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response = adminQuizTrashView(token);

  res.json(response);
});

app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;

  const response = adminQuizInfo(token, quizId);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { name } = req.body;
  const token = req.headers.token as string;

  const response = adminQuizNameUpdate(token, quizId, name);

  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { description } = req.body;
  const token = req.headers.token as string;

  const response = adminQuizDescriptionUpdate(token, quizId, description);

  res.json(response);
});

app.delete('/v1/clear', (req: Request, res: Response) => {
  const response = clear();
  res.json(response);
});

// Iteration 2 routes
app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response = adminAuthLogout(token);

  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);

  const response = adminQuizTrashRestore(token, quizId);

  res.json(response);
});

app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizids = JSON.parse(req.query.quizIds as string);

  const response = adminQuizTrashEmpty(token, quizids);

  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { userEmail } = req.body;
  const token = req.headers.token as string;

  const response = adminQuizTransferOwner(token, quizId, userEmail);

  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { questionBody } = req.body;
  const token = req.headers.token as string;

  const response = adminQuizQuestionCreate(token, quizId, questionBody);

  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { questionBody } = req.body;
  const token = req.headers.token as string;

  const response = adminQuizQuestionUpdate(token, quizId, questionId, questionBody);

  res.json(response);
});

app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;

  const response = adminQuizQuestionDelete(token, quizId, questionId);

  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { newPosition } = req.body;
  const token = req.headers.token as string;

  const response = adminQuizQuestionMove(token, quizId, questionId, newPosition);

  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;

  const response = adminQuizQuestionDuplicate(token, quizId, questionId);

  res.json(response);
});

// Iteration 3 functions
app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { imgUrl } = req.body;
  const token = req.headers.token as string;
  const response = adminQuizThumbnailUpdate(token, quizId, imgUrl);

  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;

  const response = adminQuizSessionsView(token, quizId);

  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const { autoStartNum } = req.body;

  const response = adminQuizSessionStart(token, quizId, autoStartNum);

  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token = req.headers.token as string;
  const action = req.body.action;

  const response = adminQuizSessionState(token, quizId, sessionId, action);

  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token = req.headers.token as string;

  const response = adminQuizSessionStatus(token, quizId, sessionId);

  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token = req.headers.token as string;

  const response = adminQuizSessionResults(token, quizId, sessionId);

  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results/csv', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token = req.headers.token as string;

  const response = adminQuizSessionResultsLink(token, quizId, sessionId);

  res.json(response);
});

app.post('/v1/player/join', (req: Request, res: Response) => {
  const { sessionId, name } = req.body;

  const response = playerSessionJoin(sessionId, name);

  res.json(response);
});

app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response = playerSessionStatus(playerId);

  res.json(response);
});

app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionposition = parseInt(req.params.questionposition);

  const response = playerQuestionInfo(playerId, questionposition);

  res.json(response);
});

app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionposition = parseInt(req.params.questionposition);
  const answerIds = req.body.answerIds;
  const response = playerQuestionAnswer(playerId, questionposition, answerIds);

  res.json(response);
});

app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionposition = parseInt(req.params.questionposition);

  const response = playerQuestionResults(playerId, questionposition);

  res.json(response);
});

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response = playerSessionResults(playerId);

  res.json(response);
});

app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response = playerSessionChatView(playerId);

  res.json(response);
});

app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const message = req.body.message;

  const response = playerSessionChatSend(playerId, message);

  res.json(response);
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

// app.use((req: Request, res: Response) => {
//   const error = `
//     Route not found - This could be because:
//       0. You have defined routes below (not above) this middleware in server.ts
//       1. You have not implemented the route ${req.method} ${req.path}
//       2. There is a typo in either your test or server, e.g. /posts/list in one
//          and, incorrectly, /post/list in the other
//       3. You are using ts-node (instead of ts-node-dev) to start your server and
//          have forgotten to manually restart to load the new changes
//       4. You've forgotten a leading slash (/), e.g. you have posts/list instead
//          of /posts/list in your server.ts or test file
//   `;
//   res.json({ error });
// });

// For handling errors
app.use(errorHandler());

// Start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
  loadDataStore();
});

// For coverage
process.on('SIGINT', () => {
  saveDataStore();
  server.close(() => console.log('Shutting down server gracefully.'));
});
