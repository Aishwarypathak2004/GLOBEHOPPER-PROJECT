const User=require("../models.js/user");


module.exports.getSignupForm= (req, res) => {
    res.render("users/signupform"); // no .ejs needed
}
module.exports.signup=async(req,res,next)=>{
   try{
    let {username,email,password}=req.body;
    newUser=({email,username});
   const registeredUser= await User.register(newUser,password);
   console.log(registeredUser);
   req.login(registeredUser, (err)=>{
    if (err){
        return next(err);
    }
       req.flash("success","User registration successfull");
   res.redirect("/listings");
   })
  
}
catch(e){
    req.flash("error",e.message);
    res.redirect("/signup");
}


}

module.exports.getlogin=(req,res)=>{
    res.render("users/loginform");
}

module.exports.login=(req,res)=>{

        req.flash("success","Welcome to Globehopper ;)")
        let redirectUrl=res.locals.redirectUrl || "/listings" ;
        res.redirect(redirectUrl);
    
}
module.exports.logout=(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            next(err);
        }
        else{
            req.flash("success","logged out successully");
            res.redirect("/listings")
        }
    })
    

}