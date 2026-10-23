import express from 'express'

const app = express();
app.get("/health-check", (req, res) => {
    res.send("healthy");
    res.end();
});

app.listen(3000);
