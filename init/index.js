const mongoose=require("mongoose");
const initdata=require("./data.js");
const listing=require("../models.js/listings.js");

const mongo_url="mongodb://127.0.0.1:27017/globehopper";
 
async function main() {
  await mongoose.connect(mongo_url);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
main().then(()=>
    {
        console.log("Connected to DB")

    })
.catch((err)=>
    
    {
        console.log(err);


    })

const initdb = async()=>{
    await listing.deleteMany({});
    initdata.data=initdata.data.map((obj)=>({...obj,owner:"68bd81b3923916e6c2f77129"}))
    await listing.insertMany(initdata.data);
    console.log("data  initilized")
}
initdb();