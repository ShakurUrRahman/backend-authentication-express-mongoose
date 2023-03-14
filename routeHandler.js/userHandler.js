const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const router = express.Router();
const userSchema = require("../schemas/userSchema");
const User = new mongoose.model("User", userSchema);

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
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "For reset password",
            html: `<P>Hi ${username}, please copy the link  and <a href="http://localhost:5000/user/reset-password?token=${token}">reset your password</a></P>`
        }
        transporter.sendmail(mailOptions, function (error, information) {
            if (error) {
                console.log(error);
            } else {
                console.log("mail has been sent- ", information.response);
            }
        })

    } catch (error) {
        res.status(400).json({
            "error": "Password does not reset!"
        });
    }
}

// SIGNUP
router.post("/signup", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
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


router.post("/forget-password", async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        console.log(userData)

        if (userData && userData.length > 0) {
            const randomString = randomstring.generate();

            const data = await User.updateOne({ email: email }, { $set: { token: randomString } })

            resetPasswordMail(userData.username, userData.email, randomString)

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
