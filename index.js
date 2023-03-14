const express = require('express');
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const port = process.env.PORT || 5000;
const userHandler = require("./routeHandler.js/userHandler");

// express app initialization
const app = express();

// middle wire
dotenv.config();
app.use(express.json());


// database connection with mongoose

mongoose
    .connect("mongodb://localhost/users", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("connection successful!"))
    .catch((err) => console.log(err))

app.use("/user", userHandler);

// default error handler
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: err });
}
app.use(errorHandler);


app.listen(port, () => console.log(`This server is running on ${port}`))