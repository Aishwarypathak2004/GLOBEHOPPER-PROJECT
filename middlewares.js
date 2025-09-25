const listing=require("./models.js/listings")
const ExpressError= require("./utils/expresserror");
const {listingSchema } = require("./schemas.js");
const { reviewSchema } = require("./schemas.js");
const reviews = require("./models.js/reviews.js");
module.exports.isloggedin=(req,res,next)=>{
 

          if(!req.isAuthenticated()){
            req.session.redirectUrl=req.originalUrl;
    req.flash("error","You Must be logged in to do this");
   return res.redirect("/login");
  }
  next();
}
module.exports.saveRedirectUrl=(req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl=req.session.redirectUrl;
  }
  next();
}
module.exports.isOwner=async(req,res,next)=>{
  let {id}=req.params;
   let listings= await listing.findById(id);
    if(!listings.owner.equals(req.user._id)){
    req.flash("error","You Do not have permission to do this")
   return  res.redirect(`/listings/${id}`);
  }
  next();
}
module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let msg = error.details.map(el => el.message).join(",");
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};

module.exports.validateReview=(req,res,next)=>{
  let {error}=reviewSchema.validate(req.body);
  if(error){
    let errormsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errormsg);
  } else{
    next()
  }
  }
  module.exports.isAuthor=async(req,res,next)=>{
  let {id,reviewId}=req.params;
   let review= await reviews.findById(reviewId);
    if(!review.author.equals(res.locals.currUser._id)){
    req.flash("error","You are not the author")
   return  res.redirect(`/listings/${id}`);
  }
  next();
}