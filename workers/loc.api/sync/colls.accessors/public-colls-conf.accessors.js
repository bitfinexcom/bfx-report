'use strict'

let dao = null

const { pick } = require('lodash')

const editPublicСollsСonf = async (confName, args) => {
  const name = 'publicСollsСonf'
  const data = []

  if (Array.isArray(args.params)) {
    data.push(...args.params)
  } else {
    data.push(args.params)
  }

  const { _id } = await dao.checkAuthInDb(args)
  const conf = await dao.getElemsInCollBy(
    name,
    {
      filter: {
        confName,
        user_id: _id
      },
      sort: [['symbol', 1]]
    }
  )
  const newData = data.reduce((accum, curr) => {
    if (
      conf.every(item => item.symbol !== curr.symbol) &&
      accum.every(item => item.symbol !== curr.symbol)
    ) {
      accum.push({
        ...pick(curr, ['symbol', 'start']),
        confName,
        user_id: _id
      })
    }

    return accum
  }, [])
  const removedSymbols = conf.reduce((accum, curr) => {
    if (
      data.every(item => item.symbol !== curr.symbol) &&
      accum.every(symbol => symbol !== curr.symbol)
    ) {
      accum.push(curr.symbol)
    }

    return accum
  }, [])
  const updatedData = data.reduce((accum, curr) => {
    if (
      conf.some(item => item.symbol === curr.symbol) &&
      accum.every(item => item.symbol !== curr.symbol)
    ) {
      accum.push({
        ...curr,
        confName,
        user_id: _id
      })
    }

    return accum
  }, [])

  if (newData.length > 0) {
    await dao.insertElemsToDb(
      name,
      null,
      newData
    )
  }
  if (removedSymbols.length > 0) {
    await dao.removeElemsFromDb(
      name,
      args.auth,
      {
        confName,
        user_id: _id,
        symbol: removedSymbols
      }
    )
  }

  await dao.updateElemsInCollBy(
    name,
    updatedData,
    ['confName', 'user_id', 'symbol'],
    ['start']
  )
}

const getPublicСollsСonf = async (confName, args) => {
  const { _id } = await dao.checkAuthInDb(args)
  const conf = await dao.getElemsInCollBy(
    'publicСollsСonf',
    {
      filter: {
        confName,
        user_id: _id
      },
      sort: [['symbol', 1]]
    }
  )
  const res = conf.map(item => pick(item, ['symbol', 'start']))

  return res
}

module.exports = {
  editPublicСollsСonf,
  getPublicСollsСonf,
  setDao (_dao) { dao = _dao }
}
