import geocode from "./geocode.js";

const run=async()=>{

  const location = await geocode("Fountain Chowk, Dehradun");
  console.log(location);
}
run();