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
    'map_symbols',
    [[
      ['BTCF0:USTF0', 'BTC-PERP'],
      ['ETHF0:BTCF0', 'ETH:BTC-PERP'],
      ['EURF0:USTF0', 'EUR/USDt-PERP']
    ]]
  ],
  [
    'inactive_currencies',
    [[
      'TTT',
      'DDD'
    ]]
  ],
  [
    'margin_currencies',
    [[
      'BTC',
      'ETH',
      'LEO',
      'USD'
    ]]
  ],
  [
    'inactive_symbols',
    [[
      'GRGETH',
      'GRGBTC'
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
    'positions_snap',
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
      0.0006622,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      12345,
      54321
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
      null,
      null,
      null,
      'BFX',
      null,
      null,
      { _$F7: 1 }
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
      'look at this note'
    ]]
  ],
  [
    'movement_info',
    [
      12345,
      'BTC',
      'BITCOIN',
      null,
      'REMARK',
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
      'MEMO',
      null,
      null,
      '0x754687b3cbee7cdc4b29107e325455c682dfc320ca0c4233c313263a27282760',
      'look at this note',
      null,
      null,
      -0.123,
      12345,
      null,
      null,
      'externalBankMovId',
      'externalBankMovStatus',
      'externalBankMovDescription',
      'externalBankAccInfo'
    ]
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
      ],
      [
        [
          'LET',
          [
            [
              'LEO',
              1
            ]
          ]
        ],
        [
          'LBT',
          [
            [
              'BTC',
              1
            ]
          ]
        ]
      ]
    ]
  ],
  [
    'account_summary',
    [
      null,
      null,
      null,
      null,
      [
        [0.001, 0.001, 0.001, null, null, -0.0002],
        [0.002, 0.002, 0.002, null, null, 0.00075]
      ],
      [
        [
          { curr: 'BTC', vol: 12.34858 },
          { curr: 'ETH', vol: 2 },
          {
            curr: 'Total (USD)',
            vol: 495973.5354,
            vol_safe: 495973.5354,
            vol_maker: 1115.8412,
            vol_BFX: 495973.5354,
            vol_BFX_safe: 495973.5354,
            vol_BFX_maker: 1115.8412
          }
        ],
        { BTC: 0.00005, ETH: 0.00001, USD: 2.9 },
        2.97
      ],
      [
        null,
        {
          XAUT: 0.0057617,
          IOT: 6.73137494,
          BTC: 210.94145628,
          USD: 767.84999046
        },
        116791.04974429001
      ],
      null,
      null,
      { leo_lev: 0, leo_amount_avg: 0.00123321 }
    ]
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
    'change_log',
    [[
      _ms,
      null,
      'settings: timezone',
      null,
      null,
      '127.0.0.1',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
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
  ],
  [
    'get_settings',
    [[
      'testKey',
      { value: 'strVal' }
    ]]
  ],
  [
    'set_settings',
    [
      _ms,
      'acc_ss',
      null,
      null,
      [1],
      null,
      'SUCCESS',
      null
    ]
  ],
  [
    'generate_token',
    [
      'pub:api:12ab12ab-12ab-12ab-12ab-12ab12ab12ab-read'
    ]
  ],
  [
    'invoice_list',
    [
      {
        id: '12345678-1234-1234-1234-12345678',
        t: _ms,
        duration: 900,
        amount: 0.1,
        currency: 'USD',
        orderId: '12',
        payCurrencies: [
          'BTC',
          'ETH',
          'UST-ETH',
          'LNX'
        ],
        webhook: 'https://bfx-pay-123.321.com',
        redirectUrl: 'https://bfx-pay-123.321.com?page_id123',
        status: 'EXPIRED',
        customerInfo: {
          nationality: 'UA',
          residCountry: 'UA',
          residState: null,
          residCity: 'Kharkiv',
          residZipCode: '12345',
          residStreet: 'street',
          residBuildingNo: null,
          fullName: 'name user',
          email: 'user@mail.com',
          tosAccepted: true
        },
        invoices: [
          {
            amount: 0.00000123,
            payCurrency: 'BTC',
            poolCurrency: 'BTC',
            address: '1234567890qwerty'
          },
          {
            amount: 0.0000124,
            payCurrency: 'ETH',
            poolCurrency: 'ETH',
            address: '1234567890qwerty'
          },
          {
            amount: 0.125,
            payCurrency: 'UST',
            poolCurrency: 'ETH',
            address: '1234567890qwerty'
          },
          {
            amount: 0.00000125,
            payCurrency: 'BTC',
            poolCurrency: 'LNX',
            address: '1234567890qwerty',
            ext: {
              hash: '1234567890qwerty',
              payment_request: '1234567890qwerty',
              node_pub: '1234567890qwerty'
            }
          }
        ],
        payment: {
          txid: '1234567890qwerty',
          amount: 0.123123,
          currency: 'UST',
          method: 'TETHERUSE',
          status: 'COMPLETED',
          confirmations: 5,
          created_at: '2021-09-12 03:03:03',
          updated_at: '2021-09-12 03:03:03',
          depositId: 1234321
        },
        merchantName: 'Testing'
      }
    ]
  ],
  [
    'weighted_averages',
    [
      321,
      684407.06727697,
      32.30565315,
      null,
      -596599.40936202,
      -33.16213227,
      null,
      21185.36542503,
      17990.3814539,
      null,
      1590969600000,
      1654041600000
    ]
  ]
])
