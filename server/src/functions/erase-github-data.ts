import * as functions from 'firebase-functions';

const FIREBASE_ADMIN_ERASE_PATH = '/admin/eraseGithubData';

export const eraseGithubData = functions.database.ref(FIREBASE_ADMIN_ERASE_PATH)
    .onWrite((event) => {

  var value = event.data.val();

  switch(value) {
    case true:
      console.log("Resetting all GitHub data", event.resource);
      event.data.ref.set(false);
      return event.data.ref.root.child('github').set({});
    case false:
      return null;
  }
});