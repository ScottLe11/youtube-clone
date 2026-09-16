/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {setGlobalOptions} from "firebase-functions";
// // import {onRequest} from "firebase-functions/https";
// import * as logger from "firebase-functions/logger";
// import * as functions from "firebase-functions";
// import { user } from "firebase-functions/v1/auth";
// import { initializeApp } from "firebase-admin";

import * as functions from "firebase-functions/v1";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript


initializeApp();

const firestore = new Firestore();
const storage = new Storage();

const rawBucketName = "clash-youtube-raw-videos";
const videoCollectionId = "videos";

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: "processing" | "processed",
  title?: string,
  description?: string
}


export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoURL: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User created: ${JSON.stringify(userInfo)}`);
  return;
});

export const generateUploadURL = onCall({maxInstances: 1}, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while auth");
  }

  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(rawBucketName);

  // generate unique filename
  const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 mint valid time
  });

  return {url, fileName};
});


export const getVideos = onCall({maxInstances: 1}, async () => {
  const snapshot = await firestore.collection(videoCollectionId)
    .limit(50).get();
  return snapshot.docs.map((doc) => doc.data());
});
