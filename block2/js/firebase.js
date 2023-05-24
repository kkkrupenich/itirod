import {initializeApp} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import {getStorage} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import {getDatabase} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDa7iMsA_28mApZZj9W0NlE-8BdkEq8fi0",
    authDomain: "kkkrupenich.firebaseapp.com",
    projectId: "kkkrupenich",
    storageBucket: "kkkrupenich.appspot.com",
    messagingSenderId: "302002952250",
    appId: "1:302002952250:web:8854660705cf75618f7d03"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);
const database = getDatabase(app);

export default {
    app, storage, auth, database
}