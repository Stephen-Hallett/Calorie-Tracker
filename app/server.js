const express = require("express");
const bodyParser = require("body-parser");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT;
const filePath = path.join(__dirname, "calorieHistory.csv");

function formatNZSTDate(date) {
  const formattedDate = moment(date)
    .tz("Pacific/Auckland")
    .format("YYYY-MM-DD");
  const formattedTime = moment(date).tz("Pacific/Auckland").format("HH:mm");

  return { formattedDate, formattedTime };
}

app.get("/", (req, res) => {
  res.send("What are you doing here this is just a server not a website");
});

app.post("/update", (req, res) => {
  console.log(req.body);

  const { kj } = req.body;

  if (!kj) {
    return res.status(400).send("Kj is required");
  }

  const currentDate = new Date();
  const { formattedDate, formattedTime } = formatNZSTDate(currentDate);
  const newRow = `${formattedDate},${formattedTime},${kj}\n`;

  // Append the new row to the CSV file
  fs.appendFile(filePath, newRow, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error updating CSV file");
    }

    res.status(200).send("Row added to CSV successfully");
  });
});

app.get("/getData", (req, res) => {
  const fileContent = fs.readFileSync(filePath, "utf8");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=calorieHistory.csv"
  );

  res.status(200).send(fileContent);
});

app.get("/dailyTotal", (req, res) => {
  // Get the current date in NZST (UTC+12)
  const currentDate = new Date();
  const { formattedDate, formattedTime } = formatNZSTDate(currentDate);

  let totalKj = 0;

  // Read the CSV file and calculate the total Kj for today
  fs.createReadStream("calorieHistory.csv")
    .pipe(csv())
    .on("data", (row) => {
      const rowDate = row.date; // Assuming "date" is the column name for the date in your CSV
      const rowKj = parseFloat(row.kj); // Assuming "kj" is the column name for kj in your CSV

      if (rowDate === formattedDate && !isNaN(rowKj)) {
        totalKj += rowKj;
      }
    })
    .on("end", () => {
      res.status(200).json({
        kj: totalKj,
        kcal: Math.round(totalKj / 4.184),
      });
    });
});

app.listen(port, () => {
  console.log("Server is up and running");
});
