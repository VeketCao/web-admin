/**
 * Created by Veket on 2016/10/24.
 */
var _=require('lodash');
var logger=AppCtx.Logger('test_service.js');
var testModel=AppCtx.require('serve/model/test-model.js')();
var testService=AppCtx.BaseService(testModel,logger);
var s= _.extend({},testService);

s.getHello=function(req,res,next){
    res.json({data:'hello test-service'});
};

s.mapping.unshift(['getHello','/hello','get']);

module.exports=s.initRoute();