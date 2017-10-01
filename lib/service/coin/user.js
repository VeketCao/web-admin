/**
 * Created by Veket on 2017/9/29.
 */
var _=require('lodash');
var logger=AppCtx.Logger('user_service.js');
var userModel=AppCtx.require('lib/model/user-model.js')();
var testService=AppCtx.BaseService(userModel,logger);
var s= _.extend({},testService);

s.sendEmailYzm=function(req,res,next){
    var code = _.random(100000,999999);
    console.log(req.query.data);
    //AppCtx.Utils.sendEmail(req.query.data, '邮箱验证码', '<h1>'+code+'</h1>');
    res.setHeader("Access-Control-Allow-Origin","*");
    res.json({code:AppCtx.Utils.encrypt(code)});
};

s.mapping.unshift(['sendEmailYzm','/yzm','get']);

module.exports=s.initRoute();