// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyC9fz2hBWJpVwLyiFEKkQD-Dti4QLg6cC4",
    authDomain: "angular-hq.firebaseapp.com",
    databaseURL: "https://angular-hq.firebaseio.com",
    projectId: "angular-hq",
    storageBucket: "angular-hq.appspot.com",
    messagingSenderId: "480791376247"
  }
};
