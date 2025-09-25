const express = require('express');
const router = express.Router({mergeParams: true});
const wrapAsync=require("../utils/wrapasync.js");
const reviewControler=require("../Controllers/reviewC.js")
const {isloggedin, validateReview, isAuthor}=require("../middlewares.js")





router.post("/",isloggedin,validateReview,wrapAsync(reviewControler.postReview
))

router.delete("/:reviewId",isloggedin,isAuthor,wrapAsync(reviewControler.deleteReview))

module.exports=router;