const express = require('express');
const router = express.Router();
const wrapasync = require('../utils/wrapasync');
const passport = require('passport');
const { saveRedirectUrl } = require('../middlewares');
const userControler=require("../Controllers/userC")


router.route("/signup")
.get(userControler.getSignupForm)
.post(wrapasync(userControler.signup))


router.route("/login")
.get(userControler.getlogin)
.post(saveRedirectUrl,passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),userControler.login)


router.get("/logout",userControler.logout)

module.exports = router;
