// Firebase configuration with the correct apiKey and storageBucket
const firebaseConfig = {
  apiKey: "AIzaSyD-8VGroIJfCoN3gzXg_jYJpJsq4hOngSI",
  authDomain: "apex-4a26a.firebaseapp.com",
  projectId: "apex-4a26a",
  storageBucket: "apex-4a26a.firebasestorage.app",
  messagingSenderId: "163808101285",
  appId: "1:163808101285:web:b5738d69204e0f141a1e4c",
  measurementId: "G-0EFGN5FSV5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM elements
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const registerLink = document.getElementById('register-link');

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
  console.log("Auth state check on login page:", user ? "Logged in" : "Not logged in");
  
  if (user) {
    // User is already logged in, redirect to main page
    console.log("User already authenticated, redirecting to main page");
    window.location.replace("index.html");
  }
});

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  console.log("Login attempt for:", email);
  
  // Clear previous errors
  errorMessage.textContent = "";
  
  // Sign in with email and password
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Login successful:", userCredential.user.email);
      // Login successful, redirect to main page
      window.location.replace("index.html");
    })
    .catch((error) => {
      console.error("Login error:", error.code, error.message);
      // Handle errors
      errorMessage.textContent = error.message;
    });
});

// Handle registration
registerLink.addEventListener('click', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Check if email and password are provided
  if (!email || !password) {
    errorMessage.textContent = "Please enter both email and password to register";
    return;
  }
  
  // Password should be at least 6 characters
  if (password.length < 6) {
    errorMessage.textContent = "Password should be at least 6 characters";
    return;
  }
  
  console.log("Registration attempt for:", email);
  
  // Clear previous errors
  errorMessage.textContent = "";
  
  // Create user with email and password
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Registration successful:", userCredential.user.email);
      // Registration successful, redirect to main page
      window.location.replace("index.html");
    })
    .catch((error) => {
      console.error("Registration error:", error.code, error.message);
      // Handle errors
      errorMessage.textContent = error.message;
    });
});