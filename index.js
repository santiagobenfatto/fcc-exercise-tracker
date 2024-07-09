require('dotenv').config();
const mongoose = require('mongoose')
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

//DB connection
try {
  mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true, useUnifiedTopology:true})
  console.log(`===== DATABASE CONNECTED =====`)
} catch (error) {
  console.error(`Erro in database ${error}`)
}

//Middlewares
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

//UserModel

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    require: true
  },
  count: {
    type: Number,
    default: 0
  },
  log:[
    {
      description: String,
      duration: Number,
      date:String,
      _id: false
    }
  ]
})

const userModel = mongoose.model('user', userSchema)


//Endpoints
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//POST '/api/users' 
app.post('/api/users', async (req, res) => {
  const name = req.body.username

  const result = await userModel.create({username: name})

  res.send({username: result.username, _id: result._id})
})

//GET '/api/users'
app.get('/api/users', async (req, res) => {
  const result = await userModel.find()
  
  res.send(result)
})

//POST '/api/users/:_id/exercises'
app.post('/api/users/:_id/exercises', async (req, res) => {
	const id = req.params._id

	const description = req.body.description
	const duration = Number(req.body.duration)
	const dateInput = req.body.date || ''
  const date = dateInput === ''? new Date().toDateString() : new Date(dateInput).toDateString()

	const user = await userModel.findById({_id: id})
	const exercise = {
		description:description.toString(),
		duration: duration,
		date: date.toString()
		}

	user.log.push(exercise)
	user.count = user.count +1
	await user.save()

	res.send({
		username: user.username,
		description: description,
		duration: duration,
		date: date,
		_id: id
	})
})

app.get('/api/users/:_id/logs', async (req, res) => {
	const id = req.params._id
  const fromQuery = req.query?.from
  const toQuery = req.query?.to
  const limitQuery = req.query?.limit
  
  const user = await userModel.findById(id)
  
  let exercises = user.log
  
  if(fromQuery) {
    const from = new Date(fromQuery).toDateString()
    exercises = exercises.filter( exercise => from <= exercise.date)
  }

  if(toQuery){
    const to = new Date(toQuery).toDateString()
    exercises = exercises.filter( exercise => to >= exercise.date)
  }

  if (limitQuery){
    const limit = parseInt(limitQuery)
    exercises.slice(0, limit)
  }

  //console.log(user)
	res.send({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
