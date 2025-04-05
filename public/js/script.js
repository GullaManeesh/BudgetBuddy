const signUpButton = document.getElementById("signUpButton");
const signInButton = document.getElementById("signInButton");
const signInForm = document.getElementById("signIn");
const signUpForm = document.getElementById("signup");
const signup = document.querySelector(".signuph");
const login = document.querySelector(".loginh");

signUpButton.addEventListener("click", function () {
  signInForm.style.display = "none";
  signUpForm.style.display = "block";
});

signInButton.addEventListener("click", function () {
  signInForm.style.display = "block";
  signUpForm.style.display = "none";
});

signup.addEventListener("click", () => {
  if (signup.innerHTML == "Sign up") {
    signUpForm.style.display = "block";
    signInForm.style.display = "none";
    signup.innerHTML = "login";
  } else {
    signUpForm.style.display = "none";
    signInForm.style.display = "block";
    signup.innerHTML = "Sign up";
  }
});
