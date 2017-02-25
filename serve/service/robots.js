/**
 * Created by Veket on 2017/1/14.
 * 测试网络爬虫
 */
var express=require('express');
var router=module.exports=express.Router();
var logger=AppCtx.Logger('robots.js');

var request = require('request');
var cheerio = require('cheerio');

router.get('/',function(req,res){
    logger.info("test robots...");
    res.setHeader("Access-Control-Allow-Origin","*");

    request('https://www.google.com.hk/async/finance_price_updates?async=lang:zh-CN,country:cn,rmids:%2Fg%2F1hbvvzt0m,_fmt:jspb&ei=spt5WLS4J8L18QWd3aawAg&yv=2',function (err,response,body) {
        if(!err && response.statusCode==200){
            console.log(body);
            $=cheerio.load(body);
            console.log($);
            res.json({'data':'test robots'});
        }
    });

});