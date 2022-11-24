const Bet = require('../models/Bet.model')
const ParameterRacecourse = require('../models/Racecourse.model')
const ParameterStake = require('../models/Stake.model')
const ParameterBetCode = require('../models/BetCode.model')

exports.saveBet = async (req, res, next) => {
  if (req.body.status === "win") {

    req.body.profit = (req.body.stake * req.body.price) - req.body.stake
  }

  else if (req.body.status === "loss") {

    req.body.profit = - req.body.stake
  }

  Bet.create(req.body)
    .then(response => res.json(response))
    .catch(err => next(err))
}

exports.saveParameter = async (req, res, next) => {
  let stake = null
  let model = ''

  if (req.body.type === "Stake") {
    stake = parseFloat(req.body.value)

    model = new ParameterStake({
      stake: stake
    })
  } else if (req.body.type === "Hipódromo") {
    model = new ParameterRacecourse({
      racecourse: req.body.value      
    })
  } else {
    model = new ParameterBetCode({
      betCode: req.body.value
    })
  }

  const parameter = model

  try {

    const parameterDB = await parameter.save()
    res.json({
      error: null,
      data: parameterDB
    })
    
  } catch (error) {
    res.status(400).json(error)
  }

}

exports.getRacecourses = async (req, res, next) => {

  const racecourses = await ParameterRacecourse.find().sort({ "racecourse": 1 })

  try {
    res.json({
      data: racecourses
    })
    
  } catch (error) {
    res.status(400).json(error)
  }

}

exports.getStakes = async (req, res, next) => {

  const stakes = await ParameterStake.find().sort({ "stake": 1 })

  try {
    res.json({
      data: stakes
    })
    
  } catch (error) {
    res.status(400).json(error)
  }

}

exports.getBetCodes = async (req, res, next) => {

  const betCodes = await ParameterBetCode.find().sort({ "betCode": 1 })

  try {
    res.json({
      data: betCodes
    })
    
  } catch (error) {
    res.status(400).json(error)
  }

}

exports.readHomeBets = async (req, res, next) => {
  Bet.find({status: { "$ne": "pending"}}).sort({date: -1}).limit(6)
    .then(response => res.json(response))
    .catch(err => next(err))  
}

exports.numberBets = async (req, res, next) => {
  Bet.find().count()
    .then(response => res.json(response))
    .catch(err => next(err))  
}

exports.betsList = async (req, res, next) => {
  const limit = parseInt(req.query.limit)
  const skip = parseInt(req.query.skip)

  Bet.find().sort({date: -1}).skip(skip).limit(limit)
    .then(response => res.json(response))
    .catch(err => next(err))  
}

exports.statsByYear = async (req, res, next) => {
  let year = req.params.year

  Bet.find({date:{$gte: `${year}-01-01T00:00:00Z`,$lte: `${year}-12-31T23:59:59Z`}, status: { "$ne": "pending"}})
      .then(response => res.json(response))
      .catch(err => next(err))  
}

exports.betDetails = async (req, res, next) => {
  Bet.findById(req.params.id)
  .then(response => res.json(response))
  .catch(err => next(err))  
}

exports.editBetStatus = async (req, res, next) => {
  let statusProcessed = ""
  let profitValue = 0

  if(req.body.status === "win") {
    profitValue = (req.body.stake * req.body.price) - req.body.stake
    statusProcessed = {status: 'win', profit: profitValue}

  } else if (req.body.status === "loss") {
    profitValue =- req.body.stake
    statusProcessed = {status: 'loss', profit: profitValue}
  
  } else if (req.body.status === "void") {
    statusProcessed = {status: 'void', profit: profitValue}

  } else {
    statusProcessed = {status: 'pending', profit: profitValue}
  }

  Bet.findByIdAndUpdate(req.params.id, statusProcessed, {new: true})
    .then((bet) => res.json(bet))
    .catch(err => next(err))  
}

exports.editBet = async (req, res, next) => {
  let statusProcessed = {}
  let profitValue = 0

  if(req.body.status === "win") {
    profitValue = (req.body.stake * req.body.price) - req.body.stake

  } else if (req.body.status === "loss") {
    profitValue =- req.body.stake
  }

  statusProcessed = {
    profit: profitValue,
    bookie: req.body.bookie,
    racecourse: req.body.racecourse,
    race: req.body.race,
    betName: req.body.betName,
    price: req.body.price,
    stake: req.body.stake,
    status: req.body.status,
    position: req.body.position,
    date: req.body.date,
    betCode: req.body.betCode
  }

  Bet.findByIdAndUpdate(req.params.id, statusProcessed, {new: true})
    .then((bet) => res.json(bet))
    .catch(err => next(err))
}

exports.deleteBet = async (req, res, next) => {
  Bet.findByIdAndDelete(req.params.id)
    .then(response => res.json(response))
    .catch(err => next(err))  
}