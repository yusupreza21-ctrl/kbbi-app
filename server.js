const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const NodeCache = require("node-cache");
const rateLimit = require("express-rate-limit");

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });

app.use(cors());
app.use(express.static("public"));

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
});
app.use("/api", limiter);

app.get("/api/search", async (req, res) => {
    const prefix = req.query.prefix;

    if (!prefix) {
        return res.status(400).json({ error: "Masukkan huruf awal." });
    }

    const cached = cache.get(prefix);
    if (cached) return res.json(cached);

    try {
        const response = await axios.get(
            `https://kbbi.kemdikbud.go.id/entri/${prefix}`,
            { headers: { "User-Agent": "Mozilla/5.0" } }
        );

        const $ = cheerio.load(response.data);
        let results = [];

        $("h2").each((i, el) => {
            const word = $(el).text().trim();
            if (word.toLowerCase().startsWith(prefix.toLowerCase())) {
                results.push(word);
            }
        });

        cache.set(prefix, results);
        res.json(results);

    } catch (err) {
        res.status(500).json({ error: "Gagal mengambil data." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server jalan di port " + PORT);
});
