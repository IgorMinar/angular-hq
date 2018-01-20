import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { TeardownLogic } from 'rxjs/Subscription';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { map, tap, startWith, shareReplay, throttleTime } from 'rxjs/operators';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import {GithubIssue} from "../../../server/src/functions/import-github-project";

declare const Zone: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  issues: Observable<GithubIssue[]>;
  prioritizedIssues: Observable<PrioritizedIssue[]>;
  componentNames: Observable<string[]>;

  // OUCH: it's not intuitive that I have to pass in the init value into the controller
  // OUCH: the FormControl constructor's first argument is untyped and undocumented
  componentFilterControl = new FormControl('');
  componentFilter: Observable<string>;

  issuePrFilterControl = new FormControl('');
  issuePrFilter: Observable<string>;

  issueTypeFilterControl = new FormControl('');
  issueTypeFilter: Observable<string>;


  constructor(private db: AngularFireDatabase) {

    this.componentFilter = this.componentFilterControl.valueChanges.pipe(
        // OUCH: why do I need to use `startWith` here?
        startWith(this.componentFilterControl.value),
        tap(filterValue => console.log('filtering by component: ', filterValue)),
    );

    this.issuePrFilter = this.issuePrFilterControl.valueChanges.pipe(
        startWith(this.issuePrFilterControl.value),
        tap(filterValue => console.log('filtering by issue/PR kind: ', filterValue)),
    );

    this.issueTypeFilter = this.issueTypeFilterControl.valueChanges.pipe(
        startWith(this.issueTypeFilterControl.value),
        tap(filterValue => console.log('filtering by issue type: ', filterValue)),
    );
    //
    // function zoneless() {
    //   return function <T>(/** original observable */ observable: Observable<T>): Observable<T> {
    //     /** new observable returned by the operator */
    //     return new Observable<T>(function (this: Observable<T>, subscriber: Subscriber<T>): TeardownLogic {
    //       // angular zone, hopefully, it might also be a child zone of the Angular zone
    //       const zone = Zone.current;
    //       // subscribe to the original observable from outside of the Angular zone
    //       const subscription = this._ngZone.runOutsideAngular(() => observable.subscribe(
    //           // but call all the next / error / complete callbacks within the Angular zone
    //           zone.wrap(subscriber.next.bind(subscriber), 'next'),
    //           zone.wrap(subscriber.error.bind(subscriber), 'error'),
    //           zone.wrap(subscriber.complete.bind(subscriber), 'complete')
    //       ));
    //       return () => subscription.unsubscribe();
    //     });
    //   };
    // }


    this.issues = db.list('github/issues').valueChanges().pipe(
        map((issues: GithubIssue[]) => {
          console.log('received data');
          return issues.map(issue => {
            // correct data so that it's easier to process
            if (issue.labels == undefined) {
              issue.labels = [];
            }
            return issue;
          });
        }),
        throttleTime(1000),
        //zoneless(),
        shareReplay(),
    );


    this.prioritizedIssues = combineLatest(this.issues, this.componentFilter, this.issuePrFilter, this.issueTypeFilter)
        .map(([issues, componentFilter, issuePrFilter, issueTypeFilter]) =>
            issues
                .filter(issue => !componentFilter || issue.labels.find(label => label.name === componentFilter))
                .filter(issue => issue.state === 'open')
                .map(issue => {
                  return {
                    number: issue.number,
                    title: issue.title,
                    url: issue.html_url,
                    labels: issue.labels.map(l => l.name).sort(),
                    priorityScore: issue.labels
                        .map(l => l.name)
                        .reduce(
                            (score, l) => (score * (l.match(/^(freq|severity)(\d):/) || [null, null, 1])[2]),
                            1),
                    age: Math.round((Date.now() - (new Date(issue.created_at)).valueOf())/1000/60/60/24),
                    commentsCount: issue.comments,
                    milestoneTitle: issue.milestone ? issue.milestone.title : '',
                    assignees: issue.assignees ? issue.assignees.map(assignee => ({userName: assignee.login, avatarUrl: assignee.avatar_url})) : [],
                    type: issue.pull_request ? 'pr' : 'issue',
                    issueType: (issue.labels
                        .map(label => label.name)
                        .find(label => label.startsWith('type: ')) || '')
                        .replace('type: ', '')
                  };
                })
                .filter(issue => !issuePrFilter || issue.type == issuePrFilter)
                .filter(issue => !issueTypeFilter || issue.issueType == issueTypeFilter)
            )
        .map((issues: PrioritizedIssue[]) => {
          console.log('sorting issues');
          return issues.sort((a, b) => (b.priorityScore - a.priorityScore));
        });


    this.componentNames = this.issues.map(
        issues => {
          const labelMap = {};

          issues.forEach(
              issue => issue.labels
                            .map(label => label.name)
                            .filter(label => label.startsWith('comp:'))
                            .forEach(label => labelMap[label] = true)
          );

          return Object.keys(labelMap).sort();
        }
    );
  }
}

interface PrioritizedIssue {
  number: string,
  title: string,
  url: string,
  labels: string[],
  priorityScore: number,
  age: number,
  commentsCount: number,
  type: 'issue' | 'pr',
  milestoneTitle: string,
  issueType: 'bug' | 'feat' | 'other',
  assignees: {userName: string, avatarUrl: string}[]
}