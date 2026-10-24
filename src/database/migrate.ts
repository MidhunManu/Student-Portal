import { pool } from "../config/db.js";
import type { RowDataPacket } from "mysql2";

interface MigrationRow extends RowDataPacket {
    version: string;
}

export async function runMigrations() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Ensure schema_migrations table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                version VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        const [appliedRows] = await conn.query<MigrationRow[]>(
            "SELECT version FROM schema_migrations"
        );
        const applied = new Set(appliedRows.map((r) => r.version));

        const migrations: { version: string; name: string; run: () => Promise<void> }[] = [
            {
                version: "001_create_events_table",
                name: "Create events table",
                run: async () => {
                    await conn.query(`
                        CREATE TABLE IF NOT EXISTS events (
                            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                            title VARCHAR(255) NOT NULL,
                            description TEXT NOT NULL,
                            location VARCHAR(255) NOT NULL,
                            event_date DATETIME NOT NULL,
                            registration_deadline DATETIME NOT NULL,
                            capacity INT UNSIGNED NOT NULL,
                            status ENUM('UPCOMING', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
                            created_by INT UNSIGNED NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
                            INDEX idx_events_date (event_date),
                            INDEX idx_events_status (status)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    `);
                },
            },
            {
                version: "002_create_event_registrations_table",
                name: "Create event registrations table",
                run: async () => {
                    await conn.query(`
                        CREATE TABLE IF NOT EXISTS event_registrations (
                            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                            event_id INT UNSIGNED NOT NULL,
                            user_id INT UNSIGNED NOT NULL,
                            status ENUM('CONFIRMED', 'WAITLISTED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            UNIQUE KEY uq_event_user (event_id, user_id),
                            INDEX idx_reg_event_status (event_id, status),
                            INDEX idx_reg_user_status (user_id, status)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    `);
                },
            },
            {
                version: "003_create_alumni_profiles_table",
                name: "Create alumni profiles table",
                run: async () => {
                    await conn.query(`
                        CREATE TABLE IF NOT EXISTS alumni_profiles (
                            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                            user_id INT UNSIGNED NOT NULL UNIQUE,
                            graduation_year INT NOT NULL,
                            degree VARCHAR(100) NOT NULL,
                            major VARCHAR(150) NOT NULL,
                            company VARCHAR(150) NULL,
                            role VARCHAR(150) NULL,
                            location VARCHAR(150) NULL,
                            bio TEXT NULL,
                            linkedin_url VARCHAR(255) NULL,
                            github_url VARCHAR(255) NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            INDEX idx_alumni_grad_year (graduation_year),
                            INDEX idx_alumni_company (company),
                            INDEX idx_alumni_degree (degree)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    `);
                },
            },
            {
                version: "004_create_alumni_connections_table",
                name: "Create alumni connections table",
                run: async () => {
                    await conn.query(`
                        CREATE TABLE IF NOT EXISTS alumni_connections (
                            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                            requester_id INT UNSIGNED NOT NULL,
                            recipient_id INT UNSIGNED NOT NULL,
                            status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
                            UNIQUE KEY uq_alumni_connection (requester_id, recipient_id),
                            INDEX idx_conn_recipient_status (recipient_id, status)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    `);
                },
            },
            {
                version: "005_create_job_posts_table",
                name: "Create job posts table",
                run: async () => {
                    await conn.query(`
                        CREATE TABLE IF NOT EXISTS job_posts (
                            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                            posted_by INT UNSIGNED NOT NULL,
                            title VARCHAR(255) NOT NULL,
                            company VARCHAR(255) NOT NULL,
                            location VARCHAR(255) NOT NULL,
                            job_type ENUM('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'REMOTE', 'CONTRACT') NOT NULL DEFAULT 'FULL_TIME',
                            description TEXT NOT NULL,
                            requirements TEXT NULL,
                            apply_url_or_email VARCHAR(255) NOT NULL,
                            status ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE,
                            INDEX idx_jobs_status (status),
                            INDEX idx_jobs_posted_by (posted_by)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    `);
                },
            },
            {
                version: "006_create_announcements_table",
                name: "Create announcements table",
                run: async () => {
                    await conn.query(`
                        CREATE TABLE IF NOT EXISTS announcements (
                            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                            title VARCHAR(255) NOT NULL,
                            content TEXT NOT NULL,
                            category ENUM('ACADEMIC', 'CAREER', 'CAMPUS', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
                            status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
                            published_at DATETIME NULL,
                            created_by INT UNSIGNED NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
                            INDEX idx_announcements_status (status, published_at),
                            INDEX idx_announcements_category (category)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    `);
                },
            },
        ];

        for (const migration of migrations) {
            if (!applied.has(migration.version)) {
                console.log(`Applying migration: ${migration.version} - ${migration.name}`);
                await migration.run();
                await conn.query(
                    "INSERT INTO schema_migrations (version) VALUES (?)",
                    [migration.version]
                );
                console.log(`Applied: ${migration.version}`);
            }
        }

        await conn.commit();
        console.log("All migrations applied successfully.");
    } catch (error) {
        await conn.rollback();
        console.error("Migration failed:", error);
        throw error;
    } finally {
        conn.release();
    }
}

// Allow direct execution: npx tsx src/database/migrate.ts
if (process.argv[1]?.endsWith("migrate.ts") || process.argv[1]?.endsWith("migrate.js")) {
    runMigrations()
        .then(async () => {
            await pool.end();
            process.exit(0);
        })
        .catch(async (err) => {
            console.error("Failed to execute migrations:", err);
            await pool.end();
            process.exit(1);
        });
}
