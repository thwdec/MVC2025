const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const courseController = require('../controllers/courseController'); // Controller หลักของเรา

// Middleware สำหรับตรวจสอบว่า Login หรือยัง
const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// --- Authentication Routes ---
router.get('/login', authController.showLoginPage);
router.post('/login', authController.handleLogin);
router.get('/logout', authController.handleLogout);

// --- Course & Enrollment Routes (ทั้งหมดเรียกใช้ courseController) ---
router.get('/register', isLoggedIn, courseController.showRegistrationPage);
router.get('/subject/:id', isLoggedIn, courseController.showSubjectDetailPage);
router.post('/enroll', isLoggedIn, courseController.handleEnrollment);

// --- Profile Route (หน้าใหม่) ---
router.get('/profile', isLoggedIn, courseController.showStudentProfile);


// --- Home Route ---
router.get('/', (req, res) => {
    res.redirect('/login');
});

module.exports = router;