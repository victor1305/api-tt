const Client = require('../models/Client.model')
const User = require('../models/User.model')
const PayInfo = require('../models/PayStatus.model')
const mongoose = require('mongoose');

exports.saveClient = async (req, res, next) => {

  const client = new Client({
    name: req.body.name,
    phone: req.body.phone,
    referred: req.body.referred,
    registerDate: req.body.registerDate
  })

  try {
    const saveClient = await client.save()
    res.json({
      data: saveClient
    })

  } catch (error) {
    res.status(400).json(error)
  }
}

exports.savePayInfo = async (req, res, next) => {

  const client = await Client.findById(req.body.client)
  const user = await User.findById(req.body.beneficiary)

  const payment = new PayInfo({
    client: req.body.client,
    date: req.body.month,
    status: req.body.status,
    price: req.body.price,
    type: req.body.type,
    beneficiary: req.body.beneficiary,
    information: req.body.information
  })

  try {
    const savePayment = await payment.save()

    client.payments = client.payments.concat(savePayment._id)
    await client.save()

    user.receipts = user.receipts.concat(savePayment._id)
    await user.save()

    res.json({
      data:  savePayment 
    })
  } catch (error) {
    res.status(400).json(error)
  }

}

exports.editPayInfo = async (req, res, next) => {

  const oldUser = req.params.userId
  const paymentId = req.params.paymentId
  const user = await User.findById(req.body.beneficiary)

  try {

    const savePayment = await PayInfo.findByIdAndUpdate(paymentId, req.body, { new: true })

    if (oldUser !== req.body.beneficiary) {
      await User.findByIdAndUpdate(oldUser,
        { "$pull": { "receipts": paymentId }}, { new: true }
      )
      user.receipts = user.receipts.concat(paymentId)
        await user.save()
    }

    res.json({
      data:  savePayment 
    })

  } catch (error) {
    res.status(400).json(error)
  }

}

exports.deletePayinfo = async (req, res, next) => {
  const paymentId = req.params.paymentId
  const clientId = req.params.clientId
  const userId = req.params.userId

  try {

    await PayInfo.findByIdAndDelete(paymentId)
    await Client.findByIdAndUpdate(clientId,
      { "$pull": { "payments": paymentId }}, { new: true })
    await User.findByIdAndUpdate(userId,
      { "$pull": { "receipts": paymentId }}, { new: true })

    res.json({
      msg: 'Pago borrado correctamente' 
    })

  } catch (error) {
    res.status(400).json(error)
  }
}

exports.getPaysList = async (req, res, next) => {

  const year = req.params.year
  const month = req.params.month

  try {
  
    const paymentList = await PayInfo.aggregate([
      {
        $match: { date: { $gte: new Date(`${year}-${month}-01T00:00:00.720Z`), $lt: new Date(`${year}-${month}-28T00:00:00.720Z`) } }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'client',
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'beneficiary',
          foreignField: '_id',
          as: 'beneficiary',
        }
      },
      {
        $addFields: {
          clientId: "$client._id",
          client: "$client.name",
          beneficiaryId: "$beneficiary._id",
          beneficiary: "$beneficiary.name"
        }
      },
      {
        $sort: {
          'client': 1
        }
      }
    ])

    paymentList.sort((a, b) => (a.client[0].localeCompare(b.client[0])))

    res.json({
      data: paymentList
    })
    
  } catch (error) {
    res.status(400).json(error)
  }
}

exports.getClientList = async (req, res, next) => {

  try {
    const clientList = await Client.find().sort({ "name": 1 }).populate('payments')

    res.json({
      data: clientList
    })
    
  } catch (error) {
    res.status(400).json(error)
  }
}

exports.getAdminsList = async (req, res, next) => {

  try {
    const adminsList = await User.find().sort({ "name": 1 })

    res.json({
      data: adminsList
    })
    
  } catch (error) {
    res.status(400).json(error)
  }
}

exports.getClientInfo = async (req, res, next) => {
  const id = req.params.id

  try {
    const client = await Client.findById(id).populate('payments')

    res.json({
      data: client
    })

  } catch (error) {
    res.status(400).json(error)
  }
}

exports.getPaymentsListProfile = async (req, res, next) => {
  const id = mongoose.Types.ObjectId(req.params.id)
  const month = req.params.month
  const year = req.params.year

  try {
    const paymentList = await PayInfo.aggregate([
      {
        $match: {
          beneficiary: id,
          date: { $gte: new Date(`${year}-${month}-01T00:00:00.720Z`), $lt: new Date(`${year}-${month}-28T00:00:00.720Z`) } 
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'client',
        }
      },
      {
        $addFields: {
          clientId: "$client._id",
          client: "$client.name",
        }
      },
      {
        $sort: {
          'client': 1
        }
      }
    ])

    res.json({
      data: paymentList
    })

  } catch (error) {
    res.status(400).json(error)
  }
}

//AQUI CONSULTA PARA GRÁFICAS

exports.getPaysListByYear = async (req, res, next) => {

  const year = req.params.year

  try {
  
    const paymentList = await PayInfo.aggregate([
      {
        $match: { date: { $gte: new Date(`${year}-01-01T00:00:00.720Z`), $lt: new Date(`${year}-12-31T00:00:00.720Z`) } }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'client',
        }
      },
      {
        $addFields: {
          clientId: "$client._id",
          client: "$client.name",
        }
      },
      {
        $sort: {
          'client': 1
        }
      }
    ])

    res.json({
      data: paymentList
    })
    
  } catch (error) {
    res.status(400).json(error)
  }
}