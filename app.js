if(process.env.NODE_ENV!="production"){require("dotenv").config();}


const express=require("express");
const app=express();
const mongoose=require("mongoose");
const ExpressError=require("./utils/expresserror.js");
const path=require("path");
const ejsMate = require("ejs-mate");  
const methodOverride=require("method-override");
const session=require("express-session")
const MongoStore = require('connect-mongo');
const listingreviewsRoutes=require("./routes/reviews.js")
 const listingsRoutes=require("./routes/listing.js");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models.js/user.js")
const userRoutes=require("./routes/user.js");
const dburl=process.env.ATLAS_DB_URL





 async function main() {
  await mongoose.connect(dburl);
}
main().then(()=>{console.log("Connected to DB")}).catch((err)=>{console.log(err);})

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")))

const store=MongoStore.create({
  mongoUrl:dburl,
  crypto:{
    secret:process.env.SECRET
  },
  touchAfter:24*3600,
})
store.on("error",()=>{console.log("ERROR IN MONGO SESSION STORE")})
const sessionOptions={
  store,
  secret:"mysupersecretcode",
  resave:false,
  saveUninitialized:true,
  Cookie:{
    expires: Date.now() + 7*24*60*60*1000,
    maxAge: 7*24*60*60*1000,
    httpOnly:true,
  }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());











 app.use((req,res,next)=>{

  res.locals.success=req.flash("success")
  res.locals.error=req.flash("error")
  res.locals.currUser=req.user
  next();
 })

// app.get("/demouser",async(req,res)=>{

//   let fakeUser=new User({
//     email:"fakeruser@gmail.com",
//     username:"FakestUser"
//   })
//  let registeredUser= await  User.register(fakeUser,"helloworld");
//  res.send(registeredUser)
// })




app.use("/listings/:id/reviews",listingreviewsRoutes);

app.use("/listings",listingsRoutes);
app.use("/",userRoutes);
app.get("/",(req,res)=>{

    res.redirect("/listings")

})





app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("./listings/error.ejs", { message });
});



app.listen(8080,()=>{
    console.log("listning on port 8080")
})


