const express = require('express');
const app = express();
require("dotenv").config();
 
const db = require("./db");
const port = process.env.PORT || 3000 ;

app.set('views', __dirname + '/views');
app.use(express.json());


app.get("/", (req,res)=>{
    res.send(`NODE NO DOCKER, porta ${port}`);
});

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://0.0.0.0:${port}`);
});