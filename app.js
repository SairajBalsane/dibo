// js/app.js

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your Firebase API key
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your Firebase Auth domain
    projectId: "YOUR_PROJECT_ID", // Replace with your Firebase project ID
    storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace with your Firebase storage bucket
    messagingSenderId: "YOUR_SENDER_ID", // Replace with your Firebase messaging sender ID
    appId: "YOUR_APP_ID" // Replace with your Firebase app ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Handle User Authentication State
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user.email);
        // Optionally, display user info or adjust UI elements
    } else {
        console.log("No user is logged in.");
        // Redirect to login page if on protected pages
        const protectedPages = ['patient_entry.html', 'predict.html', 'report.html'];
        const currentPage = window.location.pathname.split("/").pop();
        if (protectedPages.includes(currentPage)) {
            window.location.href = "login.html";
        }
    }
});

// Handle Logout
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = "index.html";
        }).catch(error => {
            console.error("Error during logout:", error);
            alert("Error logging out. Please try again.");
        });
    });
}

// Handle Registration
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Registration successful
                const user = userCredential.user;
                // Optionally, save additional user info to Firestore
                db.collection('users').doc(user.uid).set({
                    username: username,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert("Registration successful! Redirecting to patient entry.");
                window.location.href = "patient_entry.html";
            })
            .catch((error) => {
                console.error("Error during registration:", error);
                alert(error.message);
            });
    });
}

// Handle Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login successful
                alert("Login successful! Redirecting to patient entry.");
                window.location.href = "patient_entry.html";
            })
            .catch((error) => {
                console.error("Error during login:", error);
                alert(error.message);
            });
    });
}

// Handle Patient Data Submission
const patientForm = document.getElementById('patient-form');
if (patientForm) {
    patientForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Retrieve form values
        const fullName = document.getElementById('full_name').value.trim();
        const dob = document.getElementById('dob').value;
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const gender = document.getElementById('gender').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();

        // Basic Validation
        if (!fullName || !dob || !weight || !height || !gender || !phone || !email) {
            alert("Please fill in all fields.");
            return;
        }

        // Get current user ID
        const user = auth.currentUser;
        if (!user) {
            alert("User not authenticated. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        // Prepare patient data
        const patientData = {
            fullName,
            dob,
            weight,
            height,
            gender,
            phone,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: user.uid // To associate patient data with the user
        };

        // Save to Firestore
        db.collection('patients').add(patientData)
            .then(() => {
                alert('Patient details saved successfully!');
                window.location.href = "predict.html";
            })
            .catch(error => {
                console.error("Error adding patient data:", error);
                alert("Error saving patient details. Please try again.");
            });
    });
}

// Handle Prediction
const predictForm = document.getElementById('predict-form');
const predictionResultDiv = document.getElementById('prediction-result');
const resultTextSpan = document.getElementById('result-text');

if (predictForm) {
    predictForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get current user
        const user = auth.currentUser;
        if (!user) {
            alert("User not authenticated. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        try {
            // Fetch the latest patient data for the user
            const patientsRef = db.collection('patients')
                                   .where('userId', '==', user.uid)
                                   .orderBy('createdAt', 'desc')
                                   .limit(1);
            const snapshot = await patientsRef.get();

            if (snapshot.empty) {
                alert("No patient data found. Please enter patient details first.");
                window.location.href = "patient_entry.html";
                return;
            }

            const patientDoc = snapshot.docs[0];
            const patientData = patientDoc.data();

            console.log("Latest patient data:", patientData);

            // TODO: Integrate with your prediction model or API
            // For demonstration, we'll use a dummy prediction
            // In a real scenario, send patientData to your ML model and get the result

            // Example dummy prediction logic
            const bmi = patientData.weight / (patientData.height * patientData.height);
            let prediction = "Negative";

            if (bmi >= 25) {
                prediction = "Positive";
            }

            // Display the prediction result
            resultTextSpan.textContent = prediction;
            predictionResultDiv.style.display = "block";

            // Optionally, save the prediction result to Firestore
            await db.collection('patients').doc(patientDoc.id).update({
                prediction: prediction,
                predictedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Prediction completed successfully!");

        } catch (error) {
            console.error("Error during prediction:", error);
            alert("Error generating prediction. Please try again.");
        }
    });
}

// Handle Report Download
const downloadReportBtn = document.getElementById('download-report');

if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', async () => {
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            alert("User not authenticated. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        try {
            // Fetch the latest patient data with prediction
            const patientsRef = db.collection('patients')
                                   .where('userId', '==', user.uid)
                                   .orderBy('createdAt', 'desc')
                                   .limit(1);
            const snapshot = await patientsRef.get();

            if (snapshot.empty) {
                alert("No patient data found. Please enter patient details and get a prediction first.");
                window.location.href = "patient_entry.html";
                return;
            }

            const patientDoc = snapshot.docs[0];
            const patientData = patientDoc.data();

            if (!patientData.prediction) {
                alert("No prediction found for the latest patient data. Please perform a prediction first.");
                window.location.href = "predict.html";
                return;
            }

            // Generate PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text("Diabetes Detection Report", 105, 20, null, null, 'center');

            doc.setFontSize(12);
            doc.text(`Name: ${patientData.fullName}`, 20, 40);
            doc.text(`Date of Birth: ${patientData.dob}`, 20, 50);
            doc.text(`Gender: ${patientData.gender}`, 20, 60);
            doc.text(`Phone: ${patientData.phone}`, 20, 70);
            doc.text(`Email: ${patientData.email}`, 20, 80);
            doc.text(`Weight: ${patientData.weight} Kg`, 20, 90);
            doc.text(`Height: ${patientData.height} m`, 20, 100);

            const bmi = (patientData.weight / (patientData.height * patientData.height)).toFixed(2);
            doc.text(`BMI: ${bmi}`, 20, 110);
            doc.text(`Prediction: ${patientData.prediction}`, 20, 120);
            doc.text(`Predicted At: ${patientData.predictedAt ? patientData.predictedAt.toDate().toLocaleString() : 'N/A'}`, 20, 130);

            doc.save('Diabetes_Report.pdf');

        } catch (error) {
            console.error("Error generating report:", error);
            alert("Error generating report. Please try again.");
        }
    });
}
