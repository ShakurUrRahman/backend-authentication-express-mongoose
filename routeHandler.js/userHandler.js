const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const userSchema = require("../schemas/userSchema");
const User = new mongoose.model("User", userSchema);
const nodemailer = require("nodemailer");


// SIGNUP
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const oldUser = await User.findOne({ email })
        if (oldUser) {
            res.status(401).json({
                "error": "Email exists!"
            });
        }
        else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                name: name,
                email: email,
                password: hashedPassword,
            });

            await newUser.save();

            res.status(200).json({
                "message": "Signup was successful!",
            });
        }
    } catch {
        res.status(500).json({
            "message": "Signup was failed!",
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.find({ email });
        if (user && user.length > 0) {
            const isValidPassword = await bcrypt.compare(password, user[0].password);

            if (isValidPassword) {
                // generate token
                const token = jwt.sign({
                    email: user.email,
                    userId: user._id
                }, process.env.JWT_SECRET, {
                    expiresIn: "1h"
                });

                res.status(200).json({
                    "access_token": token,
                    "message": "Successfully Login!"
                })

            } else {
                res.status(401).json({
                    "error": "Login Failed!"
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

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
            res.status(401).json({
                "error": "User does not exists!"
            });
        } else {
            const secret = process.env.JWT_SECRET + oldUser.password;
            const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, { expiresIn: "5m" });

            const link = `http://localhost:5000/user/reset-password/${oldUser._id}/${token}`;
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'kmn3asish@gmail.com',
                    pass: 'ahozhrvbvvvdfcdh'
                }
            });

            var mailOptions = {
                from: 'youremail@gmail.com',
                to: 'shakururrahman@gmail.com',
                subject: 'Password Reset',
                text: link,
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            console.log(link);
        }
    } catch {
        res.status(401).json({
            "error": "Authentication Failed!"
        });
    }
})

// RESET PASSWORD
router.get("/reset-password/:id/:token", async (req, res) => {

    const { id, token } = req.params;
    // console.log(req.params);

    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        res.status(401).json({
            "error": "User does not exists!"
        });
    }

    const secret = process.env.JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index", { email: verify.email, status: "Not Verified" });

    } catch {
        res.status(401).json({
            "error": "Not Verified!"
        });
    }
});

// UPDATE PASSWORD
router.post("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!" });
    }
    const secret = process.env.JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            {
                _id: id,
            },
            {
                $set: {
                    password: encryptedPassword,
                },
            }
        );

        res.render("index", { email: verify.email, status: "verified" });
    } catch (error) {
        console.log(error);
        res.json({ status: "Something Went Wrong" });
    }
});



module.exports = router;
