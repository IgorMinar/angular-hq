import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const FIREBASE_EVENTQUEUE_ISSUES_PATH = '/github/eventQueue/issues/';
const FIREBASE_EVENTQUEUE_PRS_PATH = '/github/eventQueue/prs/';
const database = admin.initializeApp(functions.config().firebase!).database();
var githubWebhookSecret = functions.config()["github-webhook"].secret;


export const enqueueGitHubEvent = functions.https.onRequest((req, res) => {
  const hmac = crypto.createHmac('sha1', githubWebhookSecret);
  const eventType = req.get('X-GitHub-Event');
  const payload = req.body;
  const payloadAsString = JSON.stringify(payload);

  hmac.update(payloadAsString);
  let expectedSignature = 'sha1=' + hmac.digest('hex');
  let actualSignature = req.get('X-Hub-Signature');

  if (actualSignature == expectedSignature) {
    database.ref(eventType === 'pull_request' ? FIREBASE_EVENTQUEUE_PRS_PATH : FIREBASE_EVENTQUEUE_ISSUES_PATH)
        .push(payload).then(
            success => {console.log('success'); res.status(200).json({success: true})},
            error => res.status(500).send(error));

  } else {
    console.log(`signature verification failed! was: ${actualSignature}, expected: ${expectedSignature}, body: ${payloadAsString}`);
    res.status(403).json({success: false})
  }
});

