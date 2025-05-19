import express from 'express';
import {addPassenger, getUserById}from'../utils/user.js'
const router = express.Router(); // ✅ call the function

// Example GET route
router.post('/init',(req,res)=>{
  const data=req.body;
  addPassenger(data.id,data.contact,data.from,data.to,data.from_lat,data.from_lng,data.to_lat,data.to_lng);
  console.log("reached here")
  res.json({message:"Added the request in the queue ,Looking for driver"});
})
router.get('/ride-found',(req,res)=>{
  const userId=req.query.userId;
  const passenger=getUserById(userId);
  if(passenger.status=='waiting')
    res.json({status:"waiting"})
  else{
    res.json({status:"matched",driverContact:passenger.matchedContact});
  }
})
export default router;
