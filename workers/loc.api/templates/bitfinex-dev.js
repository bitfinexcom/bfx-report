const prettyEmail = (title, message) => {
  const html = '<div marginwidth="0" marginheight="0" style="margin:0;padding:0;background-color:#363636;min-height:100%!important;width:100%!important">' +
    '<center>' +
      '<table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" style="border-collapse:collapse;margin:0;padding:0;background-color:#D4D4D4;height:100%!important;width:100%!important">' +
        '<tbody>' +
          '<tr>' +
            '<td align="center" valign="top" style="margin:0;padding:0;border-top:0;height:100%!important;width:100%!important">' +
              '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">' +
                '<tbody>' +
                  '' +
                  '<tr>' +
                    '<td align="center" valign="top">' +
                      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#eeeeee;border-top:0;border-bottom:0">' +
                        '<tbody>' +
                          '<tr>' +
                            '<td align="center" valign="top">' +
                              '<table border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse">' +
                                '<tbody>' +
                                  '<tr>' +
                                    '<td valign="top" style="padding-top:15px;padding-bottom:10px">' +
                                      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">' +
                                        '<tbody>' +
                                          '<tr>' +
                                            '<td valign="top" style="padding:9px">' +
                                              '<table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' +
                                                '<tbody>' +
                                                  '<tr>' +
                                                    '<td valign="top" style="padding-right:9px;padding-left:9px;padding-top:0;padding-bottom:0;text-align:center">' +
                                                      '<a href="https://www.bitfinex.com" title="Bitfinex" target="_blank"><img align="center" alt="Bitfinex" src="https://www.bitfinex.com/assets/logo3.png" width="230" style="max-width:230px;padding:10px;display:inline!important;vertical-align:bottom;border:0;outline:none;text-decoration:none" ></a>' +
                                                    '</td>' +
                                                  '</tr>' +
                                                '</tbody>' +
                                              '</table>' +
                                            '</td>' +
                                          '</tr>' +
                                        '</tbody>' +
                                      '</table>' +
                                    '</td>' +
                                  '</tr>' +
                                '</tbody>' +
                              '</table>' +
                            '</td>' +
                          '</tr>' +
                        '</tbody>' +
                      '</table>' +
                    '</td>' +
                  '</tr>' +
                  '' +
                  '<tr>' +
                    '<td align="center" valign="top">' +
                      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#eeeeee;border-top:0;border-bottom:0">' +
                        '<tbody>' +
                          '<tr>' +
                            '<td align="center" valign="top" style="padding-top:10px;padding-right:10px;padding-left:10px">' +
                              '<table border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse">' +
                                '<tbody>' +
                                  '<tr>' +
                                    '<td align="center" valign="top">' +
                                      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#ffffff;">' +
                                        '<tbody>' +
                                          '<tr>' +
                                            '<td valign="top" style="padding-top:10px;padding-bottom:10px">' +
                                              '' +
                                              '<!--email title-->' +
                                              '' +
                                              '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">' +
                                                '<tbody>' +
                                                  '<tr>' +
                                                    '<td valign="top">' +
                                                      '<table align="left" border="0" cellpadding="0" cellspacing="0" width="599" style="border-collapse:collapse">' +
                                                        '<tbody>' +
                                                          '<tr>' +
                                                            '<td valign="top" style="padding:9px 18px;color:#000000;text-align:left;font-family:Helvetica;font-size:15px;line-height:150%">' +
                                                              '<h1 style="text-align:left;margin:0;padding:0;display:block;font-family:Helvetica;font-style:normal;font-weight:lighter;line-height:100%;color:#425db4!important"' +
                                                                `<span style="font-size:24px;color:#a6a6a6">${title}</span>` +
                                                              '</h1>' +
                                                            '</td>' +
                                                          '</tr>' +
                                                        '</tbody>' +
                                                      '</table>' +
                                                    '</td>' +
                                                  '</tr>' +
                                                '</tbody>' +
                                              '</table>' +
                                              '' +
                                              '<!--email body-->' +
                                              '' +
                                              '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">' +
                                                '<tbody>' +
                                                  '<tr>' +
                                                    '<td valign="top">' +
                                                      '<table align="left" border="0" cellpadding="0" cellspacing="0" width="599" style="border-collapse:collapse">' +
                                                        '<tbody>' +
                                                          '<tr>' +
                                                            '<td valign="top" style="padding-top:9px;padding-right:18px;padding-bottom:9px;padding-left:18px;color:#606060;font-family:Helvetica;font-size:15px;line-height:150%;text-align:left">' +
                                                              message +
                                                            '</td>' +
                                                          '</tr>' +
                                                        '</tbody>' +
                                                      '</table>' +
                                                    '</td>' +
                                                  '</tr>' +
                                                '</tbody>' +
                                              '</table>' +
                                              '' +
                                              '<!--email signiture-->' +
                                              '' +
                                              '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">' +
                                                '<tbody>' +
                                                  '<tr>' +
                                                    '<td valign="top">' +
                                                      '<table align="left" border="0" cellpadding="0" cellspacing="0" width="599" style="border-collapse:collapse">' +
                                                        '<tbody>' +
                                                          '<tr>' +
                                                            '<td valign="top" style="padding-top:9px;padding-right:18px;padding-bottom:9px;padding-left:18px;color:#999999;font-family:Helvetica;font-size:13px;line-height:150%;text-align:left">' +
                                                              'Regards, <br/>' +
                                                              'The Bitfinex Team <br/>' +
                                                              '<a href=\'https://www.bitfinex.com\' style=\'word-wrap:break-word;color:#BABABA;font-weight:normal;text-decoration:none;\' target=\'_blank\'>https://www.bitfinex.com</a>' +
                                                            '</td>' +
                                                          '</tr>' +
                                                        '</tbody>' +
                                                      '</table>' +
                                                    '</td>' +
                                                  '</tr>' +
                                                '</tbody>' +
                                              '</table>' +
                                              '' +
                                            '</td>' +
                                          '</tr>' +
                                        '</tbody>' +
                                      '</table>' +
                                    '</td>' +
                                  '</tr>' +
                                '</tbody>' +
                              '</table>' +
                            '</td>' +
                          '</tr>' +
                        '</tbody>' +
                      '</table>' +
                    '</td>' +
                  '</tr>' +
                    '' +
                  '<tr>' +
                    '<td align="center" valign="top" style="padding-bottom:40px">' +
                      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#D4D4D4;border-bottom:0">' +
                        '<tbody>' +
                          '<tr>' +
                            '<td align="center" valign="top">' +
                              '<table border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse">' +
                                '<tbody>' +
                                  '<tr>' +
                                    '<td valign="top" style="padding-top:10px;padding-bottom:10px">' +
                                      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">' +
                                        '<tbody>' +
                                          '<tr>' +
                                            '<td valign="top">' +
                                              '<table align="left" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse">' +
                                                '<tbody>' +
                                                  '<tr>' +
                                                    '<td valign="top" style="padding-top:9px;padding-right:18px;padding-bottom:9px;padding-left:18px;color:#999999;font-family:Helvetica;font-size:11px;line-height:125%;text-align:center">' +
                                                      'Mobile apps now available' +
                                                      '<br>' +
                                                      '<a href="https://itunes.apple.com/us/app/bitfinex/id1079033582" title="Apple Appstore" target="_blank"><img align="center" alt="Apple Appstore" src="https://www.bitfinex.com/assets/appstore.png" width="135" style="max-width:135px;padding:10px;display:inline!important;vertical-align:bottom;border:0;outline:none;text-decoration:none" ></a>' +
                                                      '<a href="https://play.google.com/store/apps/details?id=com.bitfinex.bfxapp" title="Google Play Store" target="_blank"><img align="center" alt="Google Play Store" src="https://www.bitfinex.com/assets/play.png" width="135" style="max-width:135px;padding:10px;display:inline!important;vertical-align:bottom;border:0;outline:none;text-decoration:none" ></a>' +
                                                      '<br>' +
                                                      '<a href="https://www.bitfinex.com/app" style="word-wrap:break-word;color:#999999;font-weight:normal;text-decoration:underline" target="_blank">Read more about the mobile apps</a>' +
                                                      '<br>' +
                                                      '<br>' +
                                                      '<em>Copyright 2013-2018 iFinex Inc. All rights reserved.</em>' +
                                                      '<br>' +
                                                      '<br>' +
                                                      'Want to change your email settings?<br>' +
                                                      'You can <a href="https://www.bitfinex.com/account" style="word-wrap:break-word;color:#999999;font-weight:normal;text-decoration:underline" target="_blank">update your preferences</a> in your account settings.' +
                                                      '<br>' +
                                                      'Want to disable these emails?<br/> Review our <a href="https://www.bitfinex.com/anti_spam" style="word-wrap:break-word;color:#999999;font-weight:normal;text-decoration:underline" target="_blank">Anti-Spam Policy</a>.' +
                                                      '<br><br><br><br><br><br><br><br>' +
                                                    '</td>' +
                                                  '</tr>' +
                                                '</tbody>' +
                                              '</table>' +
                                            '</td>' +
                                          '</tr>' +
                                        '</tbody>' +
                                      '</table>' +
                                    '</td>' +
                                  '</tr>' +
                                '</tbody>' +
                              '</table>' +
                            '</td>' +
                          '</tr>' +
                        '</tbody>' +
                      '</table>' +
                    '</td>' +
                  '</tr>' +
                  '' +
                '</tbody>' +
              '</table>' +
            '</td>' +
          '</tr>' +
        '</tbody>' +
      '</table>' +
    '</center>' +
  '</div>'

  return html
}

module.exports = prettyEmail
