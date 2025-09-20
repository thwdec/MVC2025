const fs = require('fs');
const csv = require('csv-parser');

const studentsFilePath = './data/students.csv';

/**
 * ค้นหาและคืนค่าข้อมูลของนักเรียนจากรหัสนักเรียน
 * @param {string} studentId - รหัสนักเรียนที่ต้องการค้นหา
 * @returns {Promise<Object|null>} - Promise ที่จะคืนค่าเป็น Object ของนักเรียนถ้าเจอ, หรือ null ถ้าไม่เจอ
 */
const getStudentById = (studentId) => {
    return new Promise((resolve, reject) => {
        let studentFound = null;

        fs.createReadStream(studentsFilePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.StudentID === studentId) {
                    studentFound = row;
                }
            })
            .on('end', () => {
                resolve(studentFound);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

module.exports = {
    getStudentById
};