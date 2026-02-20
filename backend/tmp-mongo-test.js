const mongoose=require('mongoose');
const uri=process.env.TEST_URI;
(async()=>{try{await mongoose.connect(uri,{serverSelectionTimeoutMS:15000});console.log('OK');await mongoose.disconnect();}catch(e){console.error('ERR:',e.message);process.exit(1);}})();
