const authModel = require('../models/authModel');

// แสดงหน้าฟอร์ม Login
const showLoginPage = (req, res) => {
    // ส่งค่า error เป็น null เพื่อไม่ให้แสดง error ในครั้งแรกที่เข้าหน้า
    res.render('login', { error: null });
};

// จัดการการ Login
const handleLogin = async (req, res) => {
    try {
        const { studentId, password } = req.body;
        const user = await authModel.verifyUser(studentId, password);

        if (user) {
            // ถ้าตรวจสอบสำเร็จ, ให้เก็บข้อมูล user ไว้ใน session
            req.session.user = user;
            
            // แยกไปหน้า Admin หรือ User ตาม Role
            if (user.role === 'Admin') {
                res.redirect('/admin/dashboard'); // ตัวอย่าง: พาไปหน้า dashboard ของ admin
            } else {
                res.redirect('/register'); // พาไปหน้าลงทะเบียนเรียน
            }
        } else {
            // ถ้าตรวจสอบไม่สำเร็จ, กลับไปหน้า login พร้อมแสดงข้อความ error
            res.render('login', { error: 'รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (error) {
        res.status(500).send("เกิดข้อผิดพลาดในระบบ");
    }
};

// จัดการการ Logout
const handleLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/'); // หรือหน้า error
        }
        res.clearCookie('connect.sid'); // ชื่อ cookie ของ express-session
        res.redirect('/login');
    });
};

module.exports = { showLoginPage, handleLogin, handleLogout };