// app.js (with /toggle-safety route placed and ready)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ExpressError = require("./utils/expresserror.js");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const listingreviewsRoutes = require("./routes/reviews.js");
const listingsRoutes = require("./routes/listing.js");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models.js/user.js");
const userRoutes = require("./routes/user.js");
const { checkxss } = require("./middlewares.js"); // ensure this file exports checkxss

const dburl = process.env.ATLAS_DB_URL;
if (!dburl) {
  console.error("ERROR: ATLAS_DB_URL is not set in environment. Please set it in .env");
  process.exit(1);
}

// Connect to MongoDB and only start server after successful connection
async function main() {
  try {
    await mongoose.connect(dburl);
    console.log("Connected to DB");
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas:", err && err.message ? err.message : err);
    console.error(
      "Common causes: incorrect connection string, invalid credentials, or your IP is not whitelisted in Atlas."
    );
    throw err;
  }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// --- Fundamental middleware (body parsing + method override + static) ---
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// --- Session store ---
const store = MongoStore.create({
  mongoUrl: dburl,
  crypto: { secret: process.env.SECRET || "fallbackSecret" },
  touchAfter: 24 * 3600
});
store.on("error", (e) => {
  console.error("SESSION STORE ERROR:", e);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: false, // do not create session until something stored
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
};

app.use(session(sessionOptions));
app.use(flash());

// --- Passport setup ---
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- Template locals (ensure these are always defined for ejs) ---
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null; // avoids ReferenceError in templates
  res.locals.safetyOn = req.session.safetyOn || false;
  next();
});

// --- Toggle route for Safety button ---
// Placed BEFORE the checkxss middleware so toggling cannot be blocked by the scanner
app.get("/toggle-safety", (req, res) => {
  req.session.safetyOn = !req.session.safetyOn; // toggle mode
  req.flash("success", `Safety Mode is now ${req.session.safetyOn ? "ON" : "OFF"}`);
  return res.redirect("/listings");
});

// --- Bad input page (ensure this route exists before 404 and before scanner if you prefer) ---
app.get("/badinput", (req, res) => {
  return res.status(400).render("badinput.ejs");
});

// --- Security middleware: check for XSS/SQLi patterns ---
// Place after body parsing + session + flash (so req.body and req.flash work)
app.use(checkxss);

// --- Routes ---
app.use("/listings/:id/reviews", listingreviewsRoutes);
app.use("/listings", listingsRoutes);
app.use("/", userRoutes);

app.get("/", (req, res) => {
  return res.redirect("/listings");
});

// 404 handler
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

// Error handler (defensive against double-send)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const { statusCode = 500, message = "Something went wrong!" } = err;
  return res.status(statusCode).render("listings/error.ejs", { message });
});

// Start DB then server
main()
  .then(() => {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Server not started due to DB connection failure.");
    process.exit(1);
  });

module.exports = app;
