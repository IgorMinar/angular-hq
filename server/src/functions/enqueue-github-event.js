"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var functions = require("firebase-functions");
var crypto = require("crypto");
var githubWebhookSecret = functions.config()["github-webhook"].secret;
console.log("secret:", githubWebhookSecret);
var hmac = crypto.createHmac('sha1', githubWebhookSecret);
exports.enqueueGitHubEvent = functions.https.onRequest(function (req, res) {
    console.log("secret:", githubWebhookSecret);
    hmac.update(req.body.toString());
    var signature = 'sha1=' + hmac.digest('hex');
    if (req.headers['HTTP_X_HUB_SIGNATURE'] == signature) {
        console.log('signatures match!');
    }
    else {
        console.log("signature verificationn failed! was: " + req.headers['HTTP_X_HUB_SIGNATURE'] + ", expected: " + signature);
    }
});
