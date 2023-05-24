import module from "./firebase.js"
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import {set, ref} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

// Initialize Firebase
const auth = module.auth;
const database = module.database;
const storage = module.storage;

function authenticate(auth, emailValue, passValue, formName) {
    if (formName === "signup") {
        return createUserWithEmailAndPassword(auth, emailValue, passValue);
    } else if (formName === "signin") {
        return signInWithEmailAndPassword(auth, emailValue, passValue);
    }
}

const authForm = document.getElementById('authForm');
authForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent default form submission

    const formName = authForm.getAttribute("name");
    const email = document.getElementById('username');
    const pass = document.getElementById('password');
    const passRepeat = document.getElementById('password-repeat');

    
    if (formName === "signup") {
        if (pass.value !== passRepeat.value) {
            alert("Passwords don't match");
            pass.value = "";
            passRepeat.value = "";
            return;
        }
    }

    authenticate(auth, email.value, pass.value, formName)
        .then((userCredential) => {
            const user = userCredential.user;
        
            let date, expires;
            date = new Date();
            date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toUTCString();

            document.cookie = "user-id" + "=" + (user.uid || "") + expires + "; path=/";
            document.cookie = "email" + "=" + (email.value || "") + expires + "; path=/";

            if (formName === "signup") {
                console.log('User account created: ', user.uid);
                set(ref(database, 'users/' + user.uid), {
                    id: user.uid,
                    email: email.value,
                    password: pass.value,
                    username: (email.value.split("@")[0] || ""),
                    avatar: "",
                    mothersMaidenName: "",
                })
                .then(() => {
                    window.location.href = `index.html`;
                })
                .catch((error) => {
                    alert(error);
                })
                
            } else {
                console.log('User logged-in: ', user.uid);
                window.location.href = `index.html`;
            }
        })
        .catch((error) => {
            if (formName === "signup") {
                console.error('Error creating user account: ', error);
                alert('Error creating user account: ' + error);
            } else {
                alert("Invalid credentials")
            }
        });
});