import module from "./firebase.js"
import { set, ref, get, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { ref as stRef, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";


const database = module.database;
const storage = module.storage;

const myAvatar = document.getElementById("my-avatar");
const searchBar = document.getElementById("search-bar");
const friendsList = document.getElementById("friends-list");
const messageList = document.getElementById("message-list");
const sendButton = document.getElementById("send-button");
const messageTextField = document.getElementById("message-text-field");

let currentSobesednik = "";
const currentSobesednikAvatar = document.getElementById("sobes-avatar");
const currentSobesednikName = document.getElementById("dialog-username");

const cookies = document.cookie.split(';');
const userid = cookies.find(cookie => cookie.trim().startsWith('user-id='));

const usersRef = ref(database, `users/`);
const messagesRef = ref(database, `messages/`);
let allMessages;


async function getAllMessages() {
    const response = await fetch(`https://kkkrupenich-default-rtdb.firebaseio.com/messages.json`);
    return response.json();
}

async function getAllUsers() {
    const response = await fetch(`https://kkkrupenich-default-rtdb.firebaseio.com/users.json`);
    return response.json();
}

function GetAvatar(userId, avatarName) {
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
                if (element.toString().split('/')[element.toString().split('/').length - 1] == avatarName) {
                    fileRef = element;
                    console.log("**********");
                    console.log(fileRef.toString());
                    console.log("**********");
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

function LoadFriendsList() {

    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach((userId) => {
                const user = data[userId];
                console.log("---------------");
                console.log(user);
                console.log("---------------");
                if (user.id != userid.split('=')[1]) {
                    let friend = document.createElement("li");
                    let friend_button = document.createElement("button");

                    friend_button.classList.add("friends__list-friend");
                    friend_button.setAttribute("id", `${user.id}`);
                    currentSobesednik = user.id;

                    friend_button.innerHTML += `<img src="../img/avatar.png" width="40px" height="40px" id=${user.id} class=${user.username}>`;
                    GetAvatar(user.id, user.avatar);
                    friend_button.innerHTML += `<p id=${user.id} class="../img/avatar.png">${user.username}</p>`;

                    friend.appendChild(friend_button);
                    friendsList.appendChild(friend);
                }
                else {
                    if (user.avatar != '') {
                        GetAvatar(user.id, user.avatar);
                        const avatarCookie = cookies.find(cookie => cookie.trim().startsWith(user.id + '-avatar='));
                        console.log(avatarCookie.split(user.id + '-avatar=')[1]);
                        myAvatar.setAttribute("src", `${avatarCookie.split(user.id + '-avatar=')[1]}`);
                    }
                }
            });
        }
    });
}

let allUsers = await getAllUsers();
allUsers = Object.values(allUsers);

function LoadFriendAvatars() {

    allUsers.forEach(user => {
        if (user.id != userid.split("=")[1]) {
            if (user.avatar != '') {
                const avatarCookie = cookies.find(cookie => cookie.trim().startsWith(user.id + '-avatar='));
                console.log(avatarCookie);
                friendsList.childNodes.forEach(friend => {
                    console.log(friend.childNodes[0]);
                    if (friend.childNodes[0].id == user.id) {

                        friend.childNodes[0].childNodes[0].setAttribute("src", `${avatarCookie.split(user.id + '-avatar=')[1]}`);
                        friend.childNodes[0].childNodes[1].setAttribute("class", `${avatarCookie.split(user.id + '-avatar=')[1]}`);
                    }
                })
            }
        }
    })
}

LoadFriendsList();
await new Promise(r => setTimeout(r, 1500));
LoadFriendAvatars();

searchBar.addEventListener("input", SearchUser);

function SearchUser() {

    friendsList.innerHTML = '';

    if (searchBar.value == "") {
        LoadFriendsList();
    }
    else {
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach((userId) => {
                    const user = data[userId];

                    if (user.username.startsWith(searchBar.value)) {
                        let friend = document.createElement("li");
                        let friend_button = document.createElement("button");

                        friend_button.classList.add("friends__list-friend");
                        friend_button.setAttribute("id", `${user.id}`);
                        currentSobesednik = user.id;

                        friend_button.innerHTML += `<img src="../img/avatar.png" width="40px" id=${user.id}>`;
                        friend_button.innerHTML += `<p id=${user.id} class="../img/avatar.png">${user.username}</p>`;

                        friend.appendChild(friend_button);
                        friendsList.appendChild(friend);
                    }
                });
            }
        });
    }
    LoadFriendAvatars();
}


async function LoadMessages(from, messageText, id) {
    let message = document.createElement("li");
    if (from == "send") {
        message.classList.add("dialog__messages-send");
    }
    else {
        message.classList.add("dialog__messages-receive");
    }
    message.setAttribute("id", id);
    message.innerHTML += `${messageText}`;

    messageList.appendChild(message);
    messageList.scrollTop = messageList.scrollHeight;
}


async function RefreshMessages() {
    UpdateAllMessages();

    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        console.log("logged user: " + userid.split('=')[1])
        console.log("sobesednik: " + currentSobesednik);

        let count = 0;

        if (data) {
            Object.keys(data).forEach((messageId) => {

                if (data[messageId].sender == userid.split('=')[1] && data[messageId].receiver == currentSobesednik ||
                    data[messageId].sender == currentSobesednik && data[messageId].receiver == userid.split('=')[1]) {
                    count += 1;
                }

                if (messageList.childNodes.length == 0) {
                    if (data[messageId].sender == userid.split('=')[1] && data[messageId].receiver == currentSobesednik) {
                        LoadMessages("send", data[messageId].content, messageId);
                    }
                    else if (data[messageId].sender == currentSobesednik && data[messageId].receiver == userid.split('=')[1]) {
                        LoadMessages("receive", data[messageId].content, messageId);
                    }
                }
                else {
                    if (messageList.childNodes.length + 1 == count) {
                        if (data[messageId].sender == userid.split('=')[1] && data[messageId].receiver == currentSobesednik) {
                            LoadMessages("send", data[messageId].content, messageId);
                        }
                        else if (data[messageId].sender == currentSobesednik && data[messageId].receiver == userid.split('=')[1]) {
                            LoadMessages("receive", data[messageId].content, messageId);
                        }
                    }
                }
            });
        }
    })
}

async function UpdateAllMessages() {
    allMessages = await getAllMessages();
}

async function SendMessage() {
    set(ref(database, 'messages/' + Object.values(allMessages).length), {
        sender: userid.split('=')[1],
        receiver: currentSobesednik,
        timestamp: new Date().toUTCString().slice(5, 25),
        content: messageTextField.value,
    })
        .catch((error) => {
            alert(error);
        })
}

sendButton.addEventListener('click', (e) => {
    UpdateAllMessages();
    SendMessage()
    RefreshMessages();
})

document.getElementById("friends-list").addEventListener('click', (e) => {
    if (e.target && e.target.id != "friends-list") {
        console.log(e.target.id);
        messageList.innerHTML = '';
        currentSobesednik = e.target.id;

        if (e.target.nodeName == "BUTTON") {
            console.log(e.target.childNodes[0].src);
            currentSobesednikName.innerText = e.target.childNodes[1].innerText;
            currentSobesednikAvatar.setAttribute("src", `${e.target.childNodes[0].src}`);
        }
        else if (e.target.nodeName == "IMG") {
            console.log(e.target.src);
            currentSobesednikName.innerText = e.target.className
            currentSobesednikAvatar.setAttribute("src", `${e.target.src}`);
        }
        else {
            console.log(e.target.className);
            currentSobesednikName.innerText = e.target.innerText;
            currentSobesednikAvatar.setAttribute("src", `${e.target.className}`);
        }

        RefreshMessages();
    }
});
