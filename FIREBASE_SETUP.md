# EduRPG Firebase Setup

This document outlines the steps to properly configure Firebase for the EduRPG backend.

## 1. Create a Firebase Project

If you haven't already, create a new project in the [Firebase Console](https://console.firebase.google.com/).

## 2. Generate a Service Account Key

To allow the backend server to authenticate with Firebase services, you need to generate a private key file for a service account.

1.  In the Firebase console, open **Settings > Service Accounts**.
2.  Click **Generate New Private Key**, then confirm by clicking **Generate Key**.
3.  A JSON file will be downloaded. This file contains your service account credentials.

## 3. Configure the Backend

1.  **Rename the file:** Rename the downloaded JSON file to `serviceAccountKey.json`.
2.  **Move the file:** Place the `serviceAccountKey.json` file in the `backend/src/config` directory.

The backend is configured to automatically detect this file. When it's present, it will connect to your live Firebase project. If the file is not found, it will fall back to using a mock, in-memory database for local development, as indicated by the server log message: `serviceAccountKey.json not found. Using in-memory mock services...`.
