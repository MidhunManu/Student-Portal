import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export async function runSeed() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        console.log("Seeding database...");

        // 1. Ensure College exists
        const [existingColleges] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM colleges LIMIT 1"
        );
        let collegeId = existingColleges[0]?.id;
        if (!collegeId) {
            const [res] = await conn.query<ResultSetHeader>(
                "INSERT INTO colleges (name) VALUES (?)",
                ["Apex Institute of Technology"]
            );
            collegeId = res.insertId;
        }

        // 2. Helper to find or create user
        async function getOrCreateUser(
            name: string,
            email: string,
            role: "STUDENT" | "ALUMNI" | "ADMIN",
            rawPassword: string
        ): Promise<number> {
            const [rows] = await conn.query<RowDataPacket[]>(
                "SELECT id FROM users WHERE email = ?",
                [email.toLowerCase()]
            );
            if (rows.length > 0 && rows[0]?.id) {
                return rows[0].id;
            }
            const hash = await bcrypt.hash(rawPassword, 12);
            const [result] = await conn.query<ResultSetHeader>(
                "INSERT INTO users (name, email, role, password_hash, college_id, is_verified) VALUES (?, ?, ?, ?, ?, 1)",
                [name, email.toLowerCase(), role, hash, collegeId]
            );
            return result.insertId;
        }

        const adminId = await getOrCreateUser(
            "Admin User",
            "admin@college.edu",
            "ADMIN",
            "Admin@123"
        );
        const alumniId = await getOrCreateUser(
            "Jane Alum",
            "alumni@college.edu",
            "ALUMNI",
            "Alumni@123"
        );
        const studentId = await getOrCreateUser(
            "John Student",
            "student@college.edu",
            "STUDENT",
            "Student@123"
        );

        // 3. Ensure Alumni Profile exists
        const [existingProfiles] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM alumni_profiles WHERE user_id = ?",
            [alumniId]
        );
        if (existingProfiles.length === 0) {
            await conn.query(
                `INSERT INTO alumni_profiles (user_id, graduation_year, degree, major, company, role, location, bio, linkedin_url, github_url)
                 VALUES (?, 2022, 'B.S. Computer Science', 'Software Engineering', 'Google', 'Senior Software Engineer', 'San Francisco, CA', 'Passionate about distributed systems and mentoring student developers.', 'https://linkedin.com/in/jane-alum', 'https://github.com/jane-alum')`,
                [alumniId]
            );
        }

        // 4. Ensure Sample Events exist
        const [existingEvents] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM events LIMIT 1"
        );
        if (existingEvents.length === 0) {
            const tomorrow = new Date(Date.now() + 86400000 * 5);
            const nextWeek = new Date(Date.now() + 86400000 * 10);
            const deadline = new Date(Date.now() + 86400000 * 3);

            await conn.query(
                `INSERT INTO events (title, description, location, event_date, registration_deadline, capacity, status, created_by)
                 VALUES
                 (?, ?, ?, ?, ?, ?, 'UPCOMING', ?),
                 (?, ?, ?, ?, ?, ?, 'UPCOMING', ?),
                 (?, ?, ?, ?, ?, ?, 'UPCOMING', ?)`,
                [
                    "Tech Symposium 2026: AI & Systems",
                    "Join industry leaders and academic researchers discussing the next frontier of artificial intelligence, high-performance computing, and distributed architectures.",
                    "Main Auditorium, Building A",
                    tomorrow,
                    deadline,
                    2, // Low capacity to test waitlist and promotion!
                    adminId,

                    "Alumni Career Panel & Networking Night",
                    "Connect with distinguished alumni working across big tech, high-growth startups, and finance. Bring your resume and questions.",
                    "Student Union Hall 2",
                    nextWeek,
                    tomorrow,
                    50,
                    adminId,

                    "Annual 24-Hour Campus Hackathon",
                    "Form teams, build ambitious software or hardware projects, and pitch to faculty and industry judges for cash prizes and mentorship.",
                    "Engineering Innovation Hub",
                    new Date(Date.now() + 86400000 * 14),
                    nextWeek,
                    100,
                    adminId,
                ]
            );
        }

        // 5. Ensure Sample Announcements exist
        const [existingAnnouncements] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM announcements LIMIT 1"
        );
        if (existingAnnouncements.length === 0) {
            await conn.query(
                `INSERT INTO announcements (title, content, category, status, published_at, created_by)
                 VALUES
                 (?, ?, 'GENERAL', 'PUBLISHED', NOW(), ?),
                 (?, ?, 'CAREER', 'PUBLISHED', NOW(), ?),
                 (?, ?, 'ACADEMIC', 'PUBLISHED', NOW(), ?),
                 (?, ?, 'CAMPUS', 'DRAFT', NULL, ?)`,
                [
                    "Welcome to the New Academic Semester",
                    "We welcome all incoming and continuing students back to campus. Please review your class schedules, verify your dormitory registration, and check out campus activity clubs during orientation week.",
                    adminId,

                    "Spring Campus Career Fair Registration Open",
                    "Over 40 top technology, engineering, and consulting firms will visit our campus next month. Students and graduating alumni are encouraged to submit their resumes early.",
                    adminId,

                    "Midterm Academic Examination Schedule Released",
                    "The university registrar has published the official midterm exam timetables. Check your student portal academic records for room assignments and proctor details.",
                    adminId,

                    "Draft Guidelines for Student Club Funding 2026",
                    "The administration is reviewing new guidelines for allocating club budgets. This document is currently in review and will be finalized soon.",
                    adminId,
                ]
            );
        }

        // 6. Ensure Sample Job Posts exist
        const [existingJobs] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM job_posts LIMIT 1"
        );
        if (existingJobs.length === 0) {
            await conn.query(
                `INSERT INTO job_posts (posted_by, title, company, location, job_type, description, requirements, apply_url_or_email, status)
                 VALUES
                 (?, ?, ?, ?, 'FULL_TIME', ?, ?, ?, 'ACTIVE'),
                 (?, ?, ?, ?, 'INTERNSHIP', ?, ?, ?, 'ACTIVE')`,
                [
                    alumniId,
                    "Software Engineer - Backend (Node.js & Distributed Systems)",
                    "TechFlow Cloud Solutions",
                    "San Francisco, CA / Remote",
                    "We are looking for a backend engineer passionate about building high-scale distributed services, robust APIs, and cloud-native applications.",
                    "- Solid understanding of Node.js, TypeScript, and SQL databases\n- Experience with RESTful APIs and asynchronous programming\n- Strong algorithmic problem solving",
                    "https://techflow.example.com/careers/backend-eng",

                    alumniId,
                    "Full Stack Development Summer Intern",
                    "InnovateLab Digital",
                    "New York, NY / Hybrid",
                    "Join our product engineering squad for an intensive 12-week summer internship working on cutting-edge student learning platforms.",
                    "- Working knowledge of JavaScript/TypeScript and web fundamentals\n- Enrolled in B.S. or M.S. in Computer Science or related field",
                    "careers@innovatelab.example.com",
                ]
            );
        }

        await conn.commit();
        console.log("Database seeded successfully.");
    } catch (error) {
        await conn.rollback();
        console.error("Seeding failed:", error);
        throw error;
    } finally {
        conn.release();
    }
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
    runSeed()
        .then(async () => {
            await pool.end();
            process.exit(0);
        })
        .catch(async (err) => {
            console.error("Failed to seed database:", err);
            await pool.end();
            process.exit(1);
        });
}
