// Controllers/listingsC.js
const Listing = require("../models.js/listings");

module.exports.index = async (req, res, next) => {
  try {
    const alllistings = await Listing.find({});
    return res.render("./listings/index.ejs", { alllistings });
  } catch (err) {
    return next(err);
  }
};

module.exports.newForm = (req, res) => {
  return res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listings = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");

    if (!listings) {
      req.flash("error", "Your requested listing doesn't exist");
      return res.redirect("/listings");
    }

    return res.render("./listings/show.ejs", { listings });
  } catch (err) {
    return next(err);
  }
};

module.exports.newListing = async (req, res, next) => {
  try {
    // Guard: ensure file exists before reading path/filename
    if (!req.file) {
      req.flash("error", "Image upload failed or is missing.");
      return res.redirect("/listings/new");
    }

    const url = req.file.path;
    const filename = req.file.filename;

    const newlisting = new Listing(req.body.listing || {});
    if (req.user && req.user._id) newlisting.owner = req.user._id;
    newlisting.image = { url, filename };

    await newlisting.save();
    req.flash("success", "New listing added");
    return res.redirect("/listings");
  } catch (err) {
    return next(err);
  }
};

module.exports.renderEditForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listings = await Listing.findById(id);

    if (!listings) {
      req.flash("error", "Your requested listing doesn't exist");
      return res.redirect("/listings");
    }

    let ogurl = listings.image && listings.image.url ? listings.image.url : "";
    if (ogurl) ogurl = ogurl.replace("/upload", "/upload/h_200,w_250");

    return res.render("./listings/edit.ejs", { listings, ogurl });
  } catch (err) {
    return next(err);
  }
};

module.exports.editListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body.listing || {};

    // Update the document and return the updated doc
    let listings = await Listing.findByIdAndUpdate(id, { ...data }, { new: true });

    if (!listings) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // If a new file was uploaded, update image safely
    if (req.file) {
      const url = req.file.path;
      const filename = req.file.filename;
      listings.image = { url, filename };
      await listings.save();
    }

    req.flash("success", "Listing updated");
    return res.redirect("/listings");
  } catch (err) {
    return next(err);
  }
};

module.exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted");
    return res.redirect("/listings");
  } catch (err) {
    return next(err);
  }
};
