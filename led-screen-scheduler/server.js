const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original filename
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file extensions
  const allowedExtensions = ['.mov', '.mp4', '.png', '.jpg', '.jpeg'];
  
  // Check the file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type. Only .mov, .mp4, .png, and .jpg/.jpeg files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

// Read schedule
app.get('/api/schedule', (req, res) => {
  fs.readFile('./data/schedule.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading schedule');
      return;
    }
    res.json(JSON.parse(data));
  });
});

// Update schedule
app.post('/api/schedule', (req, res) => {
  const newSchedule = req.body;
  fs.writeFile('./data/schedule.json', JSON.stringify(newSchedule, null, 2), (err) => {
    if (err) {
      res.status(500).send('Error writing schedule');
      return;
    }
    res.status(200).json(newSchedule);
  });
});

// Get all movies
app.get('/api/movies', (req, res) => {
  fs.readFile('./data/movies.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading movies');
      return;
    }
    res.json(JSON.parse(data));
  });
});

// Add a new movie
app.post('/api/movies', upload.single('movieFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded or invalid file type.');
  }

  const newMovie = {
    id: Date.now().toString(),
    title: req.file.originalname,
    filename: req.file.originalname
  };
  fs.readFile('./data/movies.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading movies');
      return;
    }
    const movies = JSON.parse(data);
    movies.push(newMovie);
    fs.writeFile('./data/movies.json', JSON.stringify(movies, null, 2), (err) => {
      if (err) {
        res.status(500).send('Error writing movie');
        return;
      }
      res.status(201).json(newMovie);
    });
  });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});