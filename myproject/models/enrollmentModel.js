const fs = require('fs');
const csv = require('csv-parser');
const studentModel = require('./studentModel');
const subjectModel = require('./subjectModel');

const enrollmentsFilePath = './data/enrollments.csv';

// ==========================================================
// ฟังก์ชันผู้ช่วยที่อาจจะขาดไป
// ==========================================================

/**
 * คำนวณอายุจากวันเกิด
 * @param {string} dobString - วันเกิดในรูปแบบ 'YYYY-MM-DD'
 * @returns {number} - อายุ (ปีเต็ม)
 */
const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

/**
 * ค้นหาและคืนค่าประวัติการลงทะเบียนทั้งหมดของนักเรียนคนเดียว
 * @param {string} studentId - รหัสนักเรียนที่ต้องการค้นหา
 * @returns {Promise<Array<Object>>} - Promise ที่จะคืนค่าเป็น Array ของ Object การลงทะเบียน
 */
const getEnrollmentsByStudent = (studentId) => {
    return new Promise((resolve, reject) => {
        const studentEnrollments = [];
        fs.createReadStream(enrollmentsFilePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.StudentID === studentId) {
                    studentEnrollments.push(row);
                }
            })
            .on('end', () => {
                resolve(studentEnrollments);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};


// ==========================================================
// ฟังก์ชันหลักสำหรับจัดการการลงทะเบียน
// ==========================================================
const createEnrollment = async (studentId, subjectId) => {
    
    // --- 1. ดึงข้อมูลที่จำเป็นทั้งหมด ---
    const student = await studentModel.getStudentById(studentId);
    const subject = await subjectModel.getSubjectById(subjectId);
    const allEnrollments = await getEnrollmentsByStudent(studentId); // บรรทัดนี้ต้องการ getEnrollmentsByStudent

    // --- 2. ตรวจสอบเงื่อนไขทั้งหมดตามลำดับ ---

    // เงื่อนไข 1: ตรวจสอบอายุ
    const age = calculateAge(student.DateOfBirth);
    if (age < 15) {
        return { success: false, message: 'ผู้สมัครต้องมีอายุ 15 ปีขึ้นไป' };
    }
    
    // เงื่อนไข 2: ตรวจสอบว่าลงทะเบียนวิชานี้ไปแล้วหรือยัง
    const isAlreadyEnrolled = allEnrollments.some(e => e.SubjectID === subjectId);
    if (isAlreadyEnrolled) {
        return { success: false, message: 'คุณได้ลงทะเบียนวิชานี้ไปแล้ว' };
    }

    // เงื่อนไข 3: ตรวจสอบวิชาบังคับก่อน (Prerequisite)
    if (subject.PrerequisiteID) {
        const prereqCourse = allEnrollments.find(e => e.SubjectID === subject.PrerequisiteID);
        if (!prereqCourse || !prereqCourse.Grade || prereqCourse.Grade === 'F') {
            return { success: false, message: `คุณต้องผ่านวิชาบังคับก่อน: ${subject.PrerequisiteID}` };
        }
    }

    // เงื่อนไข 4: ตรวจสอบจำนวนคนสูงสุด
    if (subject.MaxCapacity != -1 && parseInt(subject.CurrentEnrolled) >= parseInt(subject.MaxCapacity)) {
        return { success: false, message: 'ขออภัย รายวิชานี้เต็มแล้ว' };
    }

    // --- 3. ถ้าผ่านทุกเงื่อนไข: ดำเนินการลงทะเบียน ---

    // 3.1 อัปเดตจำนวนคนใน subjects.csv
    await subjectModel.incrementEnrolledCount(subjectId);

    // 3.2 เพิ่มข้อมูลลงใน enrollments.csv
    const enrollmentStream = fs.createWriteStream(enrollmentsFilePath, { flags: 'a' });
    enrollmentStream.write(`${studentId},${subjectId},,Enrolled\n`);
    enrollmentStream.end();

    return { success: true, message: 'ลงทะเบียนสำเร็จ!' };
};


module.exports = { 
    createEnrollment, 
    getEnrollmentsByStudent 
};