// simple express server to run frontend production build
const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const FROT_PORT = process.env.FROT_PORT || 3000;

app.use(express.static(path.join(__dirname, "build")));

app.get("/*", function (req, res) {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(FROT_PORT, () => {
	console.log(`Servidor rodando na porta ${FROT_PORT}`);
});
