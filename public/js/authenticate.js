import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCii7cG3BcLgg1cqtCHJ-Q2KWCznil41Ng",
  authDomain: "budgetbuddy-1dc2f.firebaseapp.com",
  projectId: "budgetbuddy-1dc2f",
  storageBucket: "budgetbuddy-1dc2f.appspot.com",
  messagingSenderId: "1011634252027",
  appId: "1:1011634252027:web:413c95e01aa2b808c7e85e",
  measurementId: "G-50FY0NN21M",
};

function showMessage(msg, divId) {
  var msgDiv = document.getElementById(divId);
  msgDiv.style.display = "block";
  msgDiv.style.opacity = 1;
  msgDiv.innerHTML = msg;
  setTimeout(() => {
    msgDiv.style.opacity = 0;
  }, 1000);
}

function errorMessage(msg, divId) {
  var msgDiv = document.getElementById(divId);
  msgDiv.style.display = "block";
  msgDiv.innerHTML = msg;
  msgDiv.style.opacity = 1;
  setTimeout(() => {
    msgDiv.style.opacity = 0;
  }, 5000);
}

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();

const submitSignUp = document.getElementById("submitSignUp");
const submitSignIn = document.getElementById("submitSignIn");
const googleSignUp = document.getElementById("googleSignUp");
const googleSignIn = document.getElementById("googleSignIn");

submitSignUp.addEventListener("click", (event) => {
  event.preventDefault();
  const email = document.getElementById("rEmail").value;
  const password = document.getElementById("rPassword").value;
  const username = document.getElementById("uName").value;

  const auth = getAuth();

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
          uid: user.uid,
        }),
      });

      showMessage("Account created successfully", "signUpErrorMessage");
      window.location.href = "/dashboard";
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode == "auth/email-already-in-use") {
        errorMessage("Email already in use", "signUpMessage");
      } else {
        errorMessage("Unable to create user", "signUpMessage");
      }
    });
});

submitSignIn.addEventListener("click", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const auth = getAuth();
  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredentials) => {
      const user = userCredentials.user;

      await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          uid: user.uid,
        }),
      });
      showMessage("Login successful", "signInErrorMessage");
      window.location.href = "/dashboard";
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === "auth/invalid-credentials") {
        errorMessage("Incorrect email or password", "signInMessage");
      } else {
        errorMessage("Account doesn't exist", "signInMessage");
      }
    });
});

googleSignUp.addEventListener("click", (event) => {
  event.preventDefault();
  const auth = getAuth();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  signInWithPopup(auth, provider)
    .then(async (userCredentials) => {
      const user = userCredentials.user;
      await fetch("/registerGmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          uid: user.uid,
          username: user.displayName || "",
        }),
      });

      showMessage("Sign up successful!", "signUpErrorMessage");
      window.location.href = "/dashboard";
    })
    .catch((error) => {
      errorMessage(error.message, "signInMessage");
    });
});

googleSignIn.addEventListener("click", (event) => {
  event.preventDefault();
  const auth = getAuth();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  signInWithPopup(auth, provider)
    .then(async (userCredentials) => {
      const user = userCredentials.user;
      console.log(user);
      await fetch("/registerGmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          uid: user.uid,
          username: user.displayName || "",
        }),
      });

      showMessage("Sign up successful!", "signUpErrorMessage");
      window.location.href = "/dashboard";
    })
    .catch((error) => {
      errorMessage(error.message, "signInMessage");
    });
});
