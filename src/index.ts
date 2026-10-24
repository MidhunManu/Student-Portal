import "dotenv/config";
import app from "./app.js";
import { pool } from "./config/db.js";

const PORT = Number(process.env.PORT ?? 3000);

async function startServer() {
    await pool.query("SELECT 1");

    const server = app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });

    async function shutdown() {
        console.log("Shutting down server...");

        server.close(async (error) => {
            try {
                await pool.end();

                if (error) {
                    console.error("HTTP server shutdown failed:", error);
                    process.exitCode = 1;
                }
            } catch (dbError) {
                console.error("Database shutdown failed:", dbError);
                process.exitCode = 1;
            }
        });
    }

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
}

startServer().catch(async (error) => {
    console.error("Failed to start server:", error);

    await pool.end().catch(() => { });
    process.exitCode = 1;
});