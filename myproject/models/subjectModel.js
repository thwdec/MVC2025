const fs = require('fs');
const csv = require('csv-parser');
const { format } = require('@fast-csv/format');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const subjectsFilePath = './data/subjects.csv';
const enrollmentsFilePath = './data/enrollments.csv';

// ฟังก์ชันดึงข้อมูลวิชาทั้งหมด
const getAllSubjects = () => {
    return new Promise((resolve, reject) => {
        const subjects = [];
        fs.createReadStream(subjectsFilePath)
            .pipe(csv())
            .on('data', (row) => subjects.push(row))
            .on('end', () => resolve(subjects))
            .on('error', (err) => reject(err));
    });
};

// ฟังก์ชันดึงข้อมูลวิชาตามรหัส
const getSubjectById = async (subjectId) => {
    const subjects = await getAllSubjects();
    return subjects.find(s => s.SubjectID === subjectId);
};

const incrementEnrolledCount = async (subjectId) => {
    try {
        // 1. อ่านข้อมูลทั้งหมดจากไฟล์ CSV
        const fileContent = fs.readFileSync(subjectsFilePath);
        const subjects = parse(fileContent, { columns: true, skip_empty_lines: true });

        // 2. ค้นหา index ของวิชาที่ต้องการ
        const subjectIndex = subjects.findIndex(s => s.SubjectID === subjectId);

        if (subjectIndex !== -1) {
            // 3. แปลงเป็นตัวเลข, บวก 1, แล้วแปลงกลับเป็น string
            let currentCount = parseInt(subjects[subjectIndex].CurrentEnrolled, 10);
            subjects[subjectIndex].CurrentEnrolled = (currentCount + 1).toString();

            // 4. แปลงข้อมูลกลับเป็นรูปแบบ CSV string
            const csvString = stringify(subjects, { header: true });
            
            // 5. เขียนทับไฟล์เดิมทั้งหมด
            fs.writeFileSync(subjectsFilePath, csvString);
            return true;
        }
        return false; // ไม่พบวิชา
    } catch (error) {
        console.error("Error incrementing enrolled count:", error);
        throw error; // ส่ง error ต่อเพื่อให้ controller จัดการ
    }
};

module.exports = { getAllSubjects, getSubjectById, incrementEnrolledCount };