const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const router = express.Router();
const userSchema = require("../schemas/userSchema");
const User = new mongoose.model("User", userSchema);

// SIGNUP
router.post("/signup", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            name: req.body.name,
            email: req.body.username,
            password: hashedPassword,
        });
        await newUser.save();
        res.status(200).json({
            message: "Signup was successful!",
        });
    } catch {
        res.status(500).json({
            message: "Signup was failed!",
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const user = await User.find({ email: req.body.email });
        if (user && user.length > 0) {
            const isValidPassword = await bcrypt.compare(req.body.password, user[0].password);

            if (isValidPassword) {
                // generate token
                const token = jwt.sign({
                    email: user[0].email,
                    userId: user[0]._id
                }, process.env.JWT_SECRET, {
                    expiresIn: "1h"
                });

                res.status(200).json({
                    "access_token": token,
                    "message": "Successfully Login!"
                })

            } else {
                res.status(401).json({
                    "error": "Authentication Failed!"
                });
            }

        } else {
            res.status(401).json({
                "error": "Authentication Failed!"
            });
        }
    } catch {
        res.status(401).json({
            "error": "Authentication Failed!"
        });
    }
});

// FORGET PASSWORD
const resetPasswordMail = async (username, email, token) => {
    try {
        nodemailer.createTransport({
            host: smtp.gmail.com,
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASSWORD
            }
        })


    } catch (error) {
        res.status(400).json({
            "error": "Password does not reset!"
        });
    }
}

router.post("/forget-password", async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email: email });

        if (user && user.length > 0) {
            const randomString = randomstring.generate();

            const newData = await User.updateOne({ email: email }, { $set: { token: randomString } })

            res.status(200).json({
                "message": "Please check you email inbox and reset your password!"
            });
        } else {
            res.status(200).json({
                "error": "This email does not exist!"
            });
        }
    } catch {
        res.status(401).json({
            "error": "Authentication Failed!"
        });
    }
})

module.exports = router;
