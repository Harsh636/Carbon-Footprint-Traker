import express from "express";
import bcrypt from "bcrypt";
import db from "./db.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
const app = express();
dotenv.config();
const port = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Parse JSON bodies
app.use(cors());
db.connect();
// Basic route
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }
  try {
    const userChcekQuery = "SELECT * FROM users WHERE email =$1 OR name = $2";
    const userCheckResult = await db.query(userChcekQuery, [email, name]);
    if (userCheckResult.rows.length > 0) {
      return res.status(400).json({ message: "User alredy exists!" });
    }

    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(password, saltRound);

    const insertUserQuery =
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id , name, password";

    const newUser = await db.query(insertUserQuery, [
      name,
      email,
      hashedPassword,
    ]);

    res.status(201).json({
      id: newUser.rows[0].id,
      name: newUser.rows[0].name,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try agian later." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    // Query to check if the user exists and retrieve user details
    const checkDatabaseQuery =
      "SELECT id, name, password FROM users WHERE email=$1";
    const resultDatabase = await db.query(checkDatabaseQuery, [email]);

    if (resultDatabase.rows.length === 0) {
      return res.status(400).json({ message: "User does not exist." });
    }

    const user = resultDatabase.rows[0]; // The user row from the database
    const storedHashedPassword = user.password;

    // Compare the given password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      storedHashedPassword
    );

    if (isPasswordValid) {
      try {
        // Fetch data from the `data` table for the logged-in user
        const dataQuery = "SELECT * FROM data WHERE userid=$1";
        const dataResult = await db.query(dataQuery, [user.id]);
        console.log(dataResult.rows);
        // Respond with user data and their associated records
        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
          },
          data: dataResult.rows,
        });
      } catch (dataError) {
        console.error("Error fetching user data:", dataError);
        return res.status(500).json({ message: "Error fetching user data." });
      }
    } else {
      return res.status(400).json({ message: "Wrong password" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
});

app.post("/submit-stats", async (req, res) => {
  const {
    userId,
    name,
    transportationMode,
    distance,
    electricityUsage,
    wasteGenerated,
    gasConsumption,
    carbonFootprint,
  } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: "User ID and Name are required." });
  }

  // Convert values to their appropriate types and handle NaN cases
  const parsedDistance = isNaN(parseFloat(distance))
    ? null
    : parseFloat(distance);
  const parsedElectricityUsage = isNaN(parseFloat(electricityUsage))
    ? null
    : parseFloat(electricityUsage);
  const parsedWasteGenerated = isNaN(parseFloat(wasteGenerated))
    ? null
    : parseFloat(wasteGenerated);
  const parsedGasConsumption = isNaN(parseFloat(gasConsumption))
    ? null
    : parseFloat(gasConsumption);
  const parsedUserId = isNaN(parseInt(userId, 10))
    ? null
    : parseInt(userId, 10);
  const parsedCarbonFootprint = isNaN(parseFloat(carbonFootprint))
    ? null
    : parseFloat(carbonFootprint);

  // Prepare the query and values
  const query = `
    INSERT INTO data (
      name, transportmode, distance, electricity, waste, gas, userid, carbonfootprint, date
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
    RETURNING *;
  `;
  const values = [
    name,
    transportationMode || null,
    parsedDistance,
    parsedElectricityUsage,
    parsedWasteGenerated,
    parsedGasConsumption,
    parsedUserId,
    parsedCarbonFootprint,
  ];
  console.log(values);
  try {
    // Execute the INSERT query
    const result = await db.query(query, values);

    // Check if the userId exists in the data table
    const selectQuery = `SELECT * FROM data WHERE userid = $1`;
    const selectResult = await db.query(selectQuery, [parsedUserId]);
    console.log(selectResult.rows);
    if (selectResult.rows.length > 0) {
      // Send the data that matches the userId
      res.status(200).json({
        message: "Data submitted and user data found successfully!",
        data: selectResult.rows, // Return all rows that match the userId
      });
    } else {
      res.status(200).json({
        message: "Data submitted, but no matching user data found.",
      });
    }
  } catch (err) {
    console.error("Database error:", err.message, err.stack);
    res.status(500).json({ error: "Database error.", details: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
