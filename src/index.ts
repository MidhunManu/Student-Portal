import express from 'express'
import { pool } from './db.js';
import logger from './logger.js';

const app = express();
app.get("/health-check", async (req, res) => {
   try {
        const [rows] = await pool.query("select 1 as connected");
        logger.info("database connection successful")
        res.send("healthy");
   } catch(error){
        res.send("db down");
   } finally {
        await pool.end();
        res.end();
   }
});

app.listen(process.env.PORT ?? 3000, () =>{
    logger.info(`server running on ${process.env.PORT ?? 3000}`)
});
