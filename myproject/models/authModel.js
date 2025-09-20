const fs = require('fs');
const csv = require('csv-parser');

const studentsFilePath = './data/students.csv';
const rolesFilePath = './data/roles.csv';

// ฟังก์ชันสำหรับอ่านไฟล์ CSV และ return เป็น Promise
const readCsvFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

// ฟังก์ชันสำหรับตรวจสอบผู้ใช้
const verifyUser = async (studentId, password) => {
    try {
        const students = await readCsvFile(studentsFilePath);
        const roles = await readCsvFile(rolesFilePath);

        // 1. ค้นหานักเรียนจากรหัสนักเรียน
        const student = students.find(s => s.StudentID === studentId);

        // 2. ถ้าไม่เจอนักเรียน หรือรหัสผ่าน (วันเกิด) ไม่ตรง ให้ return null
        if (!student || student.DateOfBirth !== password) {
            return null;
        }

        // 3. ค้นหา Role ของนักเรียนคนนี้
        const roleInfo = roles.find(r => r.StudentID === studentId);
        const userRole = roleInfo ? roleInfo.Role : 'User'; // ถ้าไม่ระบุใน roles.csv ให้เป็น User

        // 4. ถ้าทุกอย่างถูกต้อง ให้ return ข้อมูลผู้ใช้พร้อม role
        return {
            id: student.StudentID,
            name: `${student.FirstName} ${student.LastName}`,
            role: userRole
        };

    } catch (error) {
        console.error("Error verifying user:", error);
        return null;
    }
};

module.exports = { verifyUser };