const subjectModel = require('../models/subjectModel');
const studentModel = require('../models/studentModel');
const enrollmentModel = require('../models/enrollmentModel');

/**
 * 1. แสดงหน้าลงทะเบียน (แสดงรายวิชาทั้งหมด)
 */
const showRegistrationPage = async (req, res) => {
    try {
        const studentId = req.session.user.id;

        // --- 1. ดึงข้อมูลที่จำเป็นทั้งหมด ---
        const allSubjects = await subjectModel.getAllSubjects();
        const myEnrollments = await enrollmentModel.getEnrollmentsByStudent(studentId);

        // --- 2. เตรียมข้อมูลเพื่อจัดกลุ่ม ---
        const myEnrolledSubjectIds = new Set(myEnrollments.map(e => e.SubjectID));
        const enrollmentDetailsMap = new Map(myEnrollments.map(e => [e.SubjectID, { status: e.Status, grade: e.Grade }]));

        // --- 3. สร้าง Array ว่าง 3 ตัวเพื่อรอรับข้อมูลที่จัดกลุ่มแล้ว ---
        const notEnrolled = [];
        const enrolled = [];
        const completed = [];

        // --- 4. วนลูปเพื่อจัดกลุ่มข้อมูล ---
        for (const subject of allSubjects) {
            if (myEnrolledSubjectIds.has(subject.SubjectID)) {
                // ถ้าเคยลงทะเบียนแล้ว
                const details = enrollmentDetailsMap.get(subject.SubjectID);
                const subjectWithDetails = { ...subject, ...details };

                if (details.status === 'Completed') {
                    completed.push(subjectWithDetails);
                } else { // 'Enrolled'
                    enrolled.push(subjectWithDetails);
                }
            } else {
                // ถ้ายังไม่เคยลงทะเบียน
                notEnrolled.push(subject);
            }
        }

        // --- 5. ส่งข้อมูลทั้ง 3 กลุ่มไปให้ View (นี่คือส่วนที่แก้ไขแล้ว) ---
        res.render('register', {
            notEnrolled: notEnrolled,
            enrolled: enrolled,
            completed: completed
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลรายวิชา");
    }
};


/**
 * 2. แสดงหน้ารายละเอียดของวิชาเดียว
 */
const showSubjectDetailPage = async (req, res) => {
    try {
        const subjectId = req.params.id;
        const subject = await subjectModel.getSubjectById(subjectId);
        if (subject) {
            res.render('subjectDetail', { subject: subject });
        } else {
            res.status(404).send("ไม่พบรายวิชานี้");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดวิชา");
    }
};

/**
 * 3. จัดการ "กระบวนการ" ลงทะเบียน
 */
const handleEnrollment = async (req, res) => {
    try {
        const { subjectId } = req.body;
        const studentId = req.session.user.id; // ดึง ID นักเรียนจาก Session

        // เรียกใช้ Model ที่รับผิดชอบกระบวนการลงทะเบียนโดยตรง
        const result = await enrollmentModel.createEnrollment(studentId, subjectId);

        if (result.success) {
            // หากลงทะเบียนสำเร็จ ให้ redirect ไปยังหน้าโปรไฟล์
            res.redirect('/profile');
        } else {
            // หากไม่สำเร็จ ให้แสดงข้อความแจ้งเตือน
            res.status(400).render('error', {
                title: 'เกิดข้อผิดพลาดในการลงทะเบียน',
                message: result.message // ส่งข้อความ error ที่ได้จาก Model ไปแสดงผล
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("เกิดข้อผิดพลาดในระบบ");
    }
};

/**
 * 4. แสดงหน้าประวัติการลงทะเบียนของนักเรียน (หน้าโปรไฟล์)
 */
const showStudentProfile = async (req, res) => {
    try {
        const studentId = req.session.user.id;
        
        // 1. ดึงข้อมูลนักเรียน (เผื่อต้องการใช้ชื่อหรือข้อมูลอื่นๆ)
        const student = await studentModel.getStudentById(studentId);
        
        // 2. ดึงประวัติการลงทะเบียนทั้งหมดของนักเรียน
        const enrollments = await enrollmentModel.getEnrollmentsByStudent(studentId);
        
        // 3. ดึงข้อมูลรายละเอียดของแต่ละวิชาที่ลงทะเบียน
        const detailedCourses = await Promise.all(
            enrollments.map(async (enrollment) => {
                const subjectDetails = await subjectModel.getSubjectById(enrollment.SubjectID);
                return {
                    ...subjectDetails, // ข้อมูลวิชา เช่น ชื่อ, หน่วยกิต
                    grade: enrollment.Grade, // เกรดที่ได้
                    status: enrollment.Status, // สถานะการเรียน
                };
            })
        );
        
        res.render('profile', { 
            student: student, 
            courses: detailedCourses 
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์");
    }
};


module.exports = {
    showRegistrationPage,
    showSubjectDetailPage,
    handleEnrollment,
    showStudentProfile,
};