const express = require('express');
const path = require('path');
const appRoutes = require('./routes/appRoutes');
// แนะนำให้ใช้ express-session สำหรับจัดการการ login
const session = require('express-session'); 

const app = express();
const PORT = 3000;

// ตั้งค่า EJS เป็น View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware สำหรับอ่านข้อมูลจากฟอร์ม
app.use(express.urlencoded({ extended: true }));

// ตั้งค่า Session (จำเป็นสำหรับการ Login)
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// เรียกใช้ Routes
app.use('/', appRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});