const express = require('express');
const cors = require('cors');
const PORT = 8081;
const api = require('./routes/index')

const app = express()
app.use(cors())
app.use(express.json()); // Use express.json() middleware

app.use('/api',api);
  
app.listen(PORT, () => {
  console.log(`Server started lisiting in the port: ${PORT}`);
});