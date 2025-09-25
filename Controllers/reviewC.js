const listing=require("../models.js/listings.js");
const review=require("../models.js/reviews.js");

module.exports.postReview=async(req,res)=>{
let list= await listing.findById(req.params.id)
let newReview=new review(req.body.review);
newReview.author=req.user._id;
console.log(newReview)
list.reviews.push(newReview);
await newReview.save();
await list.save();
 req.flash("success","New review added");
res.redirect(`/listings/${list._id}`);
}



module.exports.deleteReview=async(req,res)=>{

  let list= await listing.findById(req.params.id)
  let {id, reviewId}=req.params;
  listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
  await review.findByIdAndDelete(reviewId);
   req.flash("success","Review Deleted");


  res.redirect(`/listings/${list._id}`);


}
