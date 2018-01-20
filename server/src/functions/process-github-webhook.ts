import * as functions from 'firebase-functions';
import {GithubIssue} from './import-github-project';

const FIREBASE_EVENTQUEUE_ISSUES_PATH = '/github/eventQueue/issues/{eventId}';
const FIREBASE_EVENTQUEUE_PRS_PATH = '/github/eventQueue/prs/{eventId}';


export const processGithubIssueEvent = functions.database.ref(FIREBASE_EVENTQUEUE_ISSUES_PATH)
    .onCreate((event) => {

      const issueEventPayload = event.data.val() as IssuesEventPayload;
      const issue = issueEventPayload.issue;

      console.log(`${FIREBASE_EVENTQUEUE_ISSUES_PATH}#onCreate`, event.resource, issue.number);

      return event.data.ref.root.child('github').child('issues').child(issue.number)
          .set(issue)
          .then(() => event.data.ref.remove());
});


export const processGithubPrEvent = functions.database.ref(FIREBASE_EVENTQUEUE_PRS_PATH)
    .onCreate((event) => {

      const prEvent = event.data.val() as PullRequestEvent;
      const pr = prEvent.pull_request;

      console.log(`${FIREBASE_EVENTQUEUE_PRS_PATH}#onCreate`, event.resource, pr.number);

      return event.data.ref.root.child('github').child('issues').child(pr.number)
          .set(pr)
          .then(() => event.data.ref.remove());
    });


interface GitHubPullRequest extends GithubIssue {}

interface IssuesEventPayload {
  issue: GithubIssue
  action: string,
  sender: any
}

interface PullRequestEvent {
  number: number,
  pull_request: GitHubPullRequest,
  sender: any
}