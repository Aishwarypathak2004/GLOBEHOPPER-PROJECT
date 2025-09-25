const listing =require("../models.js/listings")

module.exports.index=async(req,res)=>{
  let alllistings= await listing.find({})
  res.render("./listings/index.ejs",{alllistings})
}
module.exports.newForm=(req,res)=>{
  


  res.render("./listings/new.ejs");
}

module.exports.showListing=async(req, res) => {
  let {id} = req.params;
  const listings = await listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");

  if (!listings) {
    req.flash("error", "Your requested listing doesn't exist");
    return res.redirect("/listings"); // ✅ use return to stop execution
  }
 

  res.render("./listings/show.ejs", { listings }); // ✅ only called once
}

module.exports.newListing=async(req,res,next)=>{
 let url= req.file.path;
 let filename=req.file.filename;

const newlisting=new listing(req.body.listing);
console.log(req.user)
newlisting.owner=req.user._id;
newlisting.image={url,filename}
 await  newlisting.save()
 req.flash("success","New listing added");
 res.redirect("/listings")
}
module.exports.renderEditForm=async(req,res)=>{

       let {id}=req.params;
  const listings= await listing.findById(id);
  if (!listings) {
    req.flash("error", "Your requested listing doesn't exist");
    return res.redirect("/listings"); // ✅ use return to stop execution
  }
  let ogurl=listings.image.url;
  ogurl=ogurl.replace("/upload","/upload/h_200,w_250")
  res.render("./listings/edit.ejs",{listings,ogurl});

}
module.exports.editListing=async(req,res,next)=>{


  let {id}=req.params;
 
  

  let listings =await listing.findByIdAndUpdate(id, {...req.body.listing})
  
  if (typeof req.file!=="undefined"){
    let url=req.file.path;
  let filename=req.file.filename
  listings.image={url,filename}
  await listings.save()
}
   req.flash("success","listing updated");
  
    res.redirect("/listings");

  }

  module.exports.delete=async(req,res)=>{
      let {id}=req.params;
  
      await listing.findByIdAndDelete(id);
       req.flash("success","Listing Deleted");
      res.redirect("/listings");
    
  
  }
  




