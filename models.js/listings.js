const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const review=require("./reviews.js");
const user = require("./user.js");

const listingSchema=new Schema({
    title:{
       type: String,
       required:true
    },
    description:String,
    image: {
    url: String,
    filename:String,
    
  },

    price:
    {type:Number,
      minimum:0,
      default:0
    
    },
    location:String,
    country:String,
    reviews:[{
        type:Schema.Types.ObjectId,
        ref:"review",
    }],
    owner:{
      type:Schema.Types.ObjectId,
      ref:"User"
    }
})
listingSchema.post("findOneAndDelete", async function(listing){
if(listing){
    await review.deleteMany({_id:{$in:listing.reviews}})
}

})

const listing = mongoose.model("listing",listingSchema)
module.exports=listing;