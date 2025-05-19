import { PassengerData, RouteData, UserRole } from '../types';
import axios from 'axios';
const API_BASE_URL = '/api';

type Coordinate = {
  lat: number;
  lng: number;
};
type PassengerMatch = {
  id: string;
  contact: string;
};
type DriverInfo={
  status:string,
  driverContact:number
};

export async function checkDriverFound(setDriverInfo:React.Dispatch<React.SetStateAction<DriverInfo | null>>){

  const passengerId=localStorage.getItem('userId');
  try{
    const response=await axios.get("http://localhost:3000/passenger/ride-found",{
      params:{userId:passengerId}
    })
    if(response.data.status=="waiting"){
      setDriverInfo(null)
    }
    else{
      setDriverInfo(response.data)
    }
  }catch(error){
    console.log("Server Error",error)
  }
}
export async function passengerRequest(pickup:Coordinate, dropoff:Coordinate, sourceName:string, destinationName:string) {
  
   // or any method to generate a unique ID
   const  passengerId=localStorage.getItem('userId');
   const contact=localStorage.getItem('userContact')
  try {
    const response = await axios.post('http://localhost:3000/passenger/init', {
      id: passengerId,
      contact,
      from: sourceName,
      to: destinationName,
      from_lat: pickup.lat,
      from_lng: pickup.lng,
      to_lat: dropoff.lat,
      to_lng: dropoff.lng,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to submit passenger request:', error);
    throw error;
  }
}

export async function driverRequest(capacity:number,start:Coordinate,end:Coordinate,sourceName:string,destinationName:string){
  const driverId=localStorage.getItem("userId");

  const contact=localStorage.getItem('userContact')
  try{
    const response=await axios.post('http://localhost:3000/driver/init',{
      id:driverId,
      contact,
      capacity,
      from:sourceName,
      to:destinationName,
      from_lat: start.lat,
      from_lng: start.lng,
      to_lat: end.lat,
      to_lng: end.lng,
    })
    return response.data;
  }catch(error){
    console.log("failed to submit driver route",error)
  }
}


export async function pollPassenger(setMatchedPassenger:React.Dispatch<React.SetStateAction<PassengerMatch | null>>){
  const userId=localStorage.getItem("userId");
  if(!userId){

    console.log("No user id");
    return ;
  }
  try{
    const res=await axios.get("http://localhost:3000/driver/check-passenger",{
      params:{userId}
    })
    const data=res.data;
    if (data.matches && data.matches.length > 0) {
      console.log("Matched passengers:", data.matches);
      setMatchedPassenger(data.matches[0]);
      // You can also trigger UI update or notification here
 
    } else {
      console.log("No matches found.");
    }
    return data;
  }catch(error){

    console.log("Something bad happened"+error);
  }
}
export async function getSharedRoute(passengerId:string){
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.log("No userId found in localStorage");
    return;
  }

  try {
    const response = await axios.post("http://localhost:3000/driver/modified-path", {
      driverId:userId,
      passengerId
    });
    return response.data;
  } catch (error) {
    console.log("failed", error);
  }

} 
export async function getNaturalRoute(start: Coordinate, end: Coordinate) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.log("No userId found in localStorage");
    return;
  }

  try {
    const response = await axios.get("http://localhost:3000/driver/natural-route", {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.log("failed", error);
  }
}
