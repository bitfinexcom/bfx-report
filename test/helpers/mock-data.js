'use strict'

const _ms = Date.now()

module.exports = new Map([
  [
    'symbols',
    [[
      'btcusd',
      'ethusd',
      'ethbtc',
      'btceur',
      'btcjpy',
      'iotusd',
      'iotbtc',
      'ioteth',
      'ifxusd',
      'ioteur',
      'euxusx'
    ]]
  ],
  [
    'futures',
    [[
      'BTCF0:USDF0',
      'BTCF0:USTF0'
    ]]
  ],
  [
    'user_info',
    [
      123,
      'fake@email.fake',
      'fakename',
      null,
      null,
      null,
      null,
      'Kyiv'
    ]
  ],
  [
    'tickers_hist',
    [[
      'BTC',
      null,
      6,
      null,
      6,
      18793,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      _ms
    ]]
  ],
  [
    'wallets',
    [[
      'margin',
      'BTC',
      -0.04509854,
      null,
      null
    ]]
  ],
  [
    'positions_hist',
    [[
      'tBTCUSD',
      'ACTIVE',
      0.1,
      16500,
      0,
      0,
      null,
      null,
      null,
      null,
      null,
      12345,
      _ms,
      _ms
    ]]
  ],
  [
    'positions',
    [[
      'tBTCUSD',
      'ACTIVE',
      0.1,
      16500,
      0,
      0,
      null,
      null,
      null,
      null,
      null,
      12345,
      _ms,
      _ms,
      null,
      1,
      null,
      12345,
      12345,
      JSON.stringify({ someMetaData: 'someMetaData' })
    ]]
  ],
  [
    'positions_audit',
    [[
      'tBTCUSD',
      'ACTIVE',
      0.1,
      16500,
      0,
      0,
      null,
      null,
      null,
      null,
      null,
      12345,
      _ms,
      _ms,
      null,
      1,
      null,
      12345,
      12345,
      JSON.stringify({ someMetaData: 'someMetaData' })
    ]]
  ],
  [
    'ledgers',
    [[
      12345,
      'BTC',
      null,
      _ms,
      null,
      -0.00001,
      5.555555,
      null,
      'Crypto Withdrawal fee on wallet exchange'
    ]]
  ],
  [
    'trades',
    [[
      12345,
      'tBTCUSD',
      _ms,
      12345,
      0.01,
      12345,
      null,
      null,
      false,
      -0.00001,
      'BTC'
    ]]
  ],
  [
    'public_trades',
    [[
      12345,
      _ms,
      0.01,
      12345
    ]]
  ],
  [
    'status_messages',
    [[
      'tBTCF0:USTF0',
      _ms,
      null,
      8402.8,
      8412.8,
      null,
      101091.28492701,
      null,
      _ms,
      -0.00019831,
      5534,
      null,
      0.0006622
    ]]
  ],
  [
    'f_trade_hist',
    [[
      12345,
      'fBTC',
      _ms,
      12345,
      12345.12345,
      0.003,
      30,
      null
    ]]
  ],
  [
    'order_trades',
    [[
      12345,
      'tBTCUSD',
      _ms,
      12345,
      0.01,
      12345,
      null,
      null,
      false,
      -0.00001,
      'BTC'
    ]]
  ],
  [
    'orders',
    [[
      12345,
      12345,
      12345,
      'tBTCUSD',
      _ms,
      _ms,
      0,
      0.01,
      'EXCHANGE LIMIT',
      null,
      null,
      null,
      '0',
      'EXECUTED @ 15065.0(0.01)',
      null,
      null,
      12345,
      12345,
      12345,
      12345,
      null,
      null,
      null,
      false,
      null,
      null
    ]]
  ],
  [
    'active_orders',
    [[
      12345,
      12345,
      12345,
      'tBTCUSD',
      _ms,
      _ms,
      0,
      0.01,
      'EXCHANGE LIMIT',
      null,
      null,
      null,
      '0',
      'EXECUTED @ 15065.0(0.01)',
      null,
      null,
      12345,
      12345,
      12345,
      12345,
      null,
      null,
      null,
      false,
      null,
      null
    ]]
  ],
  [
    'movements',
    [[
      12345,
      'BTC',
      'BITCOIN',
      null,
      null,
      _ms,
      _ms,
      null,
      null,
      'PENDING REVIEW',
      null,
      null,
      -0.009999,
      -0.000001,
      null,
      null,
      '0x047633e8e976dc13a81ac3e45564f6b83d10aeb9',
      null,
      null,
      null,
      '0x754687b3cbee7cdc4b29107e325455c682dfc320ca0c4233c313263a27282760',
      null
    ]]
  ],
  [
    'f_offer_hist',
    [[
      12345,
      'fUSD',
      _ms,
      _ms,
      0,
      100,
      null,
      null,
      null,
      null,
      'EXECUTED at 0.7% (100.0)',
      null,
      null,
      null,
      0.007,
      7,
      false,
      false,
      null,
      false,
      null
    ]]
  ],
  [
    'f_loan_hist',
    [[
      12345,
      'fUSD',
      1,
      _ms,
      _ms,
      200,
      null,
      'CLOSED (used)',
      null,
      null,
      null,
      0.00168,
      30,
      null,
      null,
      false,
      false,
      null,
      false,
      null,
      false
    ]]
  ],
  [
    'f_credit_hist',
    [[
      12345,
      'fUSD',
      -1,
      _ms,
      _ms,
      681.25937738,
      null,
      'CLOSED (reduced)',
      null,
      null,
      null,
      0,
      2,
      null,
      null,
      false,
      false,
      null,
      false,
      null,
      false,
      null
    ]]
  ],
  [
    'currencies',
    [
      [
        'BTC',
        'ETH',
        'EUR',
        'EUT',
        'GRG',
        'IOT',
        'MLN',
        'REP',
        'USD',
        'UST',
        'ZRX'
      ],
      [
        ['EUT', 'EURt'],
        ['GRG', 'WWWWWW'],
        ['IOT', 'IOTA'],
        ['UST', 'USDt']
      ],
      [
        ['BTC', 'Bitcoin'],
        ['ETH', 'Ethereum'],
        ['EUR', 'Euro'],
        ['GRG', 'RigoBlock'],
        ['IOT', 'IOTA'],
        ['MLN', 'Melonport'],
        ['USD', 'US Dollar'],
        ['ZRX', '0x']
      ],
      [
        ['REP', 'ETH'],
        ['GRG', 'ETH'],
        ['ZRX', 'ETH'],
        ['MLN', 'ETH']
      ],
      [
        [
          'BTC',
          [
            'https://blockstream.info',
            'https://blockstream.info/address/VAL',
            'https://blockstream.info/tx/VAL'
          ]
        ],
        [
          'ETH',
          [
            'https://etherscan.io',
            'https://etherscan.io/address/VAL',
            'https://etherscan.io/tx/VAL'
          ]
        ]
      ]
    ]
  ],
  [
    'account_summary',
    [{
      _id: '2a2a2a22222a2aa22a22aa2a',
      user_id: 12345,
      summary: {
        time: '2020-02-10T06:49:30.270Z',
        status: {
          resid_hint: null
        },
        is_locked: false,
        trade_vol_30d: [
          {
            curr: 'BTC',
            vol: 0.12345
          },
          {
            curr: 'ETH',
            vol: 1.12345
          },
          {
            curr: 'BTCF0',
            vol: 0.12345
          },
          {
            curr: 'Total (USD)',
            vol: 12345.12345,
            vol_maker: 12345.12345,
            vol_BFX: 12345.12345,
            vol_BFX_maker: 12345.12345
          }
        ],
        fees_funding_30d: {
          USD: 123.12345
        },
        fees_funding_total_30d: 123.12345,
        fees_trading_30d: {
          USTF0: 0.987654321,
          ETH: 0.0012345,
          USD: 1.987654321,
          BTC: 0.000098765
        },
        fees_trading_total_30d: 1.12345,
        maker_fee: 0.001,
        taker_fee: 0.002,
        deriv_maker_rebate: -0.0002,
        deriv_taker_fee: 0.00098
      },
      t: 1581317371000
    }]
  ],
  [
    'logins_hist',
    [[
      12345,
      null,
      _ms,
      null,
      '127.0.0.1',
      null,
      null,
      JSON.stringify({
        asn: '14061, DigitalOcean, LLC',
        geo: 'Unknown, SG',
        user_agent: {
          os: 'Linux x86_64',
          raw: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
          browser: 'Chrome',
          version: '79.0.3945.130',
          platform: 'X11',
          is_mobile: false
        }
      })
    ]]
  ],
  [
    'candles',
    [[
      _ms,
      12345,
      12345,
      12345,
      12345,
      12345
    ]]
  ]
])
