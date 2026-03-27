const express = require('express');
const app = express();

const port = process.env.PORT || 3000 

app.get("/", (req,res)=>{
    res.send(`NODE NO DOCKER, porta ${port}`);
});

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://0.0.0.0:${port}`);
})