import module from "./firebase.js";
import { EmailAuthProvider, updatePassword, updateEmail, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";;
import { ref, get, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { ref as stRef, uploadBytes, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";


const auth = module.auth;
const database = module.database;
const storage = module.storage;

let currentUser;

const cookies = document.cookie.split(';');
const userid = cookies.find(cookie => cookie.trim().startsWith('user-id='));
const logoutButton = document.getElementById("logout-button");

const avatarImg = document.getElementById("avatar-img");
const avatar = document.getElementById("image_input");
const inputEmail = document.getElementById("email");
const inputMothersMaidenName = document.getElementById("name");
const inputPassword = document.getElementById("password");
const saveChangesButton = document.getElementById("save-button");
let allMessages;


function deleteCookie() {
    document.cookie.split(";").forEach(function (c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
    window.location.href = `signin.html`;
};

logoutButton.addEventListener('click', (e) => {
    deleteCookie();
})


async function getAllUsers() {
    const response = await fetch(`https://kkkrupenich-default-rtdb.firebaseio.com/users.json`);
    return response.json();
}

async function GetUserInfo() {
    let users = await getAllUsers();
    users = Object.values(users);
    console.log(users);

    users.forEach(element => {
        if (element.id == userid.split("=")[1]) {
            currentUser = element;
            console.log(element.id);
        }
    });

    console.log(currentUser);

    inputEmail.value = currentUser.email;
    inputMothersMaidenName.value = currentUser.mothersMaidenName;
    inputPassword.value = currentUser.password;

    if (currentUser.avatar != '') {
        GetAvatar(currentUser.id, currentUser.avatar);
        const avatarCookie = cookies.find(cookie => cookie.trim().startsWith((userid + '-avatar=').split("user-id=")[1]));
        console.log(avatarCookie.split((userid+'-avatar=').split("user-id=")[1])[1]);
        avatarImg.setAttribute("src", avatarCookie.split((userid+'-avatar=').split("user-id=")[1])[1]);
    }
}

GetUserInfo();

async function getAllMessages() {
    const response = await fetch(`https://kkkrupenich-default-rtdb.firebaseio.com/messages.json`);
    return response.json();
}

async function UpdateAllMessages() {
    allMessages = await getAllMessages();
}


async function SaveChanges() {
    UploadAvatar();

    const credentials = EmailAuthProvider.credential(
        currentUser.email,
        currentUser.password
    )

    console.log(auth.currentUser);
    console.log(credentials);

    const result = await reauthenticateWithCredential(
        auth.currentUser,
        credentials
    )

    console.log(result);

    let date, expires;
    date = new Date();
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();

    if (inputEmail.value != currentUser.email) {

        if (inputEmail.value != '') {
            console.log(inputEmail.value + ' ' + currentUser.email);
            updateEmail(auth.currentUser, inputEmail.value)
                .then(() => {
                    console.log("Email updated!");
                    document.cookie = "email" + "=" + (inputEmail.value || "") + expires + "; path=/";

                    update(ref(database, 'users/' + auth.currentUser.uid),
                        { "email": `${inputEmail.value}` });

                    update(ref(database, 'users/' + auth.currentUser.uid),
                        { "username": `${inputEmail.value.split("@")[0]}` });

                    currentUser.email = inputEmail.value;
                })
                .catch((error) => {
                    console.log(error);
                })
        }
    }

    if (inputMothersMaidenName.value != currentUser.mothersMaidenName) {
        console.log(inputMothersMaidenName.value + ' ' + currentUser.mothersMaidenName);
        if (inputMothersMaidenName.value != '') {
            update(ref(database, 'users/' + auth.currentUser.uid),
                { "mothersMaidenName": `${inputMothersMaidenName.value}` });
        }

    }

    if (inputPassword.value != currentUser.password) {
        console.log(inputPassword.value + ' ' + currentUser.password);

        if (inputPassword.value != '') {
            updatePassword(auth.currentUser, inputPassword.value)
                .then(() => {
                    console.log("Password updated!");

                    update(ref(database, 'users/' + auth.currentUser.uid),
                        { "password": `${inputPassword.value}` });

                    currentUser.password = inputPassword.value;
                })
                .catch((error) => {
                    console.log(error);
                })
        }
    }
}

saveChangesButton.addEventListener('click', (e) => {
    e.preventDefault();
    SaveChanges();
})

function UploadAvatar() {
    const avatarFile = avatar.files[0];
    if (avatarFile != null) {
        const avatarRef = stRef(storage, 'avatars/' + userid.split("=")[1] + '/' + avatarFile.name);

        uploadBytes(avatarRef, avatarFile).then(() => {
            console.log('File uploaded successfully!');
            currentUser.avatar = avatarFile.name;
            let uid = cookies.find(cookie => cookie.trim().startsWith('user-id=')).split("=")[1];
            update(ref(database, 'users/' + uid), { "avatar": `${currentUser.avatar}` });

        }).catch((error) => {
            console.error('Error uploading file:', error);
        });
    }
}

function GetAvatar(userId, avatar) {
    let date, expires;
    date = new Date();
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();

    const avatarRef = stRef(storage, 'avatars/' + userId + '/');
    listAll(avatarRef)
        .then((res) => {
            // Get the first file in the list
            let fileRef = res.items[0];
            res.items.forEach(element => {
                console.log(element.toString().split('/')[element.toString().split('/').length - 1]);
                if (element.toString().split('/')[element.toString().split('/').length - 1] == avatar) {
                    fileRef = element;
                    console.log(fileRef.toString());
                }
            })
            // Get the download URL of the file
            getDownloadURL(fileRef)
                .then((url) => {
                    // Use the download URL to display the image
                    document.cookie = userId + "-avatar" + "=" + (url || "") + expires + "; path=/";
                })
                .catch((error) => {
                    console.error("Error getting download URL:", error);
                });
        })
        .catch((error) => {
            // Redirect to home page
            console.log("no avatar");
        });
}