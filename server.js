const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();

    parser.parseString(req.file.buffer.toString(), (parseErr, result) => {
        if (parseErr) {
            return res.status(500).send('Error parsing XML');
        }

        const questions = result.quiz.question;

        questions.forEach(question => {
            if (question.$.type === "essay") {
                const graderInfo = question.graderinfo;
                const generalFeedback = question.generalfeedback;

                if (graderInfo && generalFeedback) {
                    generalFeedback[0].text[0] = graderInfo[0].text[0];
                }
            }
        });

        const modifiedXml = builder.buildObject(result);
        const outputPath = path.join(__dirname, 'public', 'temp.xml');

        fs.writeFile(outputPath, modifiedXml, (writeErr) => {
            if (writeErr) {
                return res.status(500).send('Error writing modified XML');
            }

            res.json({ filePath: '/temp.xml' });
        });
    });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

