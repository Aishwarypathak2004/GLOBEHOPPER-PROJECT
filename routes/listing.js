const express = require("express");
const router = express.Router();
const listingsC = require("../Controllers/listingsC");
const { upload } = require("../cloudConfig");

// INDEX
router.get("/", listingsC.index);

// NEW FORM
router.get("/new", listingsC.newForm);

// CREATE (scan + upload)
router.post("/", upload.single("image"), listingsC.newListing);

// SHOW
router.get("/:id", listingsC.showListing);

// EDIT FORM
router.get("/:id/edit", listingsC.renderEditForm);

// UPDATE (scan + upload)
router.patch("/:id", upload.single("image"), listingsC.editListing);

// DELETE
router.delete("/:id", listingsC.delete);

module.exports = router;
