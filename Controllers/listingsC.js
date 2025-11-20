// Controllers/listingsC.js
const Listing = require("../models.js/listings");
const { cloudinary } = require("../cloudConfig");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

// -----------------------------------------------------------------------
// 🔍 VIRUSTOTAL FILE SCAN HELPER (WITH POLLING UNTIL SCAN COMPLETES)
// -----------------------------------------------------------------------
async function scanFileWithVirusTotal(tempPath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(tempPath));

  // Step 1 → Upload file to VirusTotal
  const uploadRes = await axios.post(
    "https://www.virustotal.com/api/v3/files",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "x-apikey": process.env.VT_API_KEY,
      },
    }
  );

  const analysisId = uploadRes.data.data.id;
  let status = "queued";
  let stats = null;

  // 🔄 POLLING LOOP: WAIT FOR VIRUSTOTAL TO FINISH SCANNING
  while (status !== "completed") {
    await new Promise((res) => setTimeout(res, 1500)); // wait 1.5 seconds

    const analysisRes = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      {
        headers: { "x-apikey": process.env.VT_API_KEY },
      }
    );

    status = analysisRes.data.data.attributes.status;
    stats = analysisRes.data.data.attributes.stats;

    console.log("VirusTotal status:", status, "Stats:", stats);
  }

  // ⚠️ IF malicious OR suspicious → BAD FILE
  return !(stats.malicious > 0 || stats.suspicious > 0);
}

// -----------------------------------------------------------------------
// LISTING CONTROLLERS
// -----------------------------------------------------------------------

// INDEX
module.exports.index = async (req, res, next) => {
  try {
    const alllistings = await Listing.find({});
    return res.render("./listings/index.ejs", { alllistings });
  } catch (err) {
    next(err);
  }
};

// NEW FORM
module.exports.newForm = (req, res) => {
  return res.render("./listings/new.ejs");
};

// SHOW LISTING
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
    next(err);
  }
};

// -----------------------------------------------------------------------
// CREATE NEW LISTING (VirusTotal + Cloudinary Upload)
// -----------------------------------------------------------------------
module.exports.newListing = async (req, res, next) => {
  try {
    if (!req.file) {
      req.flash("error", "File upload missing.");
      return res.redirect("/listings/new");
    }

    const tempPath = req.file.path;

    // SAFETY MODE CHECK
    if (req.session.safetyOn) {
      const isSafe = await scanFileWithVirusTotal(tempPath);

      if (!isSafe) {
        fs.unlinkSync(tempPath);
        req.flash("error", "⚠️ Unsafe file detected! Upload blocked.");
        return res.redirect("/listings/new");
      }
    }

    // Upload SAFE file to Cloudinary
    const result = await cloudinary.uploader.upload(tempPath, {
      folder: "Globehopper",
      resource_type: "auto",
    });

    fs.unlinkSync(tempPath); // delete local temp file

    const newlisting = new Listing(req.body.listing || {});
    newlisting.owner = req.user._id;
    newlisting.image = {
      url: result.secure_url,
      filename: result.public_id,
    };

    await newlisting.save();

    req.flash("success", "New listing added!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

// -----------------------------------------------------------------------
// EDIT FORM
// -----------------------------------------------------------------------
module.exports.renderEditForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listings = await Listing.findById(id);

    if (!listings) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    let ogurl = listings.image?.url || "";
    if (ogurl) ogurl = ogurl.replace("/upload", "/upload/h_200,w_250");

    return res.render("./listings/edit.ejs", { listings, ogurl });
  } catch (err) {
    next(err);
  }
};

// -----------------------------------------------------------------------
// UPDATE LISTING (VirusTotal + Cloudinary Upload)
// -----------------------------------------------------------------------
module.exports.editListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listings = await Listing.findById(id);
    if (!listings) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Update text fields
    Object.assign(listings, req.body.listing);

    if (req.file) {
      const tempPath = req.file.path;

      // SAFETY MODE CHECK
      if (req.session.safetyOn) {
        const isSafe = await scanFileWithVirusTotal(tempPath);

        if (!isSafe) {
          fs.unlinkSync(tempPath);
          req.flash("error", "⚠️ Unsafe file detected! Upload blocked.");
          return res.redirect(`/listings/${id}/edit`);
        }
      }

      // Upload SAFE file to Cloudinary
      const result = await cloudinary.uploader.upload(tempPath, {
        folder: "Globehopper",
        resource_type: "auto",
      });

      fs.unlinkSync(tempPath);

      listings.image = {
        url: result.secure_url,
        filename: result.public_id,
      };
    }

    await listings.save();

    req.flash("success", "Listing updated!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

// -----------------------------------------------------------------------
// DELETE LISTING
// -----------------------------------------------------------------------
module.exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};
