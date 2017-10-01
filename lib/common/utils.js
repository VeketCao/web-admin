/**
 * Created by Veket on 2017/9/30.
 */
var _=require('lodash');

var s=module.exports={};

/*****邮件发送 start*****/
var nodemailer = require('nodemailer');
var MAILER=AppCtx.APP_CONFIG.MAILER;
var transporter = nodemailer.createTransport({
    host:MAILER.host,
    port:MAILER.port,
    auth:MAILER.auth
});


/**
 * @param {String} recipient 收件人
 * @param {String} subject 发送的主题
 * @param {String} html 发送的html内容
 */
s.sendEmail = function (recipient, subject, html) {
    var opts = {
        from:MAILER.sender,
        to:recipient,
        subject:subject,
        html:html
    }

    transporter.sendMail(opts,function (err,info) {
        if (err) {
            return console.log(err);
        }
        console.log('Message sent: %s', info.messageId);
    });
};

/*****邮件发送 end*****/

/*****加密 start*****/
var CryptoJS = require('crypto-js');

s.encrypt=function(msg,key){//不可逆加密
    key=key||AppCtx.APP_CONFIG.SECRET_KEY;
    return  CryptoJS.HmacSHA256(msg.toString(),key).toString(CryptoJS.enc.Hex);
};


/*****加密 end*****/


