import "dotenv/config"
import mysql from "mysql2/promise"

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (! value) {
        throw new Error(`Missing required enviornment variable ${name}`);
    }
    return value;
}

export const pool = mysql.createPool({
    host: requiredEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    database: requiredEnv("DB_NAME"),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});