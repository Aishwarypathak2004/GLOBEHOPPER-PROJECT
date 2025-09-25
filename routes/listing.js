const express = require('express');
const router = express.Router();
const wrapAsync=require("../utils/wrapasync.js");
const {isloggedin, isOwner,validateListing}=require("../middlewares.js")
const listingControler=require("../Controllers/listingsC.js")
const multer  = require('multer')
const {storage}=require("../cloudConfig.js")
const upload = multer({storage})

router.get("/new",isloggedin, listingControler.newForm)

router.route("/")
.get(wrapAsync(listingControler.index))

 .post(
    isloggedin,
    upload.single("listing[image]"),  // matches your form field
    validateListing,
    wrapAsync(listingControler.newListing)
  );


router.route("/:id")
.get( wrapAsync(listingControler.showListing))

.put(isloggedin,isOwner,upload.single('listing[image]'),validateListing,wrapAsync(listingControler.editListing)
)

.delete(isloggedin,wrapAsync(listingControler.delete))






router.get("/:id/edit",isloggedin,wrapAsync(listingControler.renderEditForm))





module.exports=router