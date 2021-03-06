/**
 * Created by Veket on 2016/10/24.
 */
require('./app-context');
var _=require('lodash');
var path=require('path');
var fs=require('fs');
var express=require('express');
var Promise=require('bluebird');
var logger=AppCtx.Logger('app.js');
var AppConfig=AppCtx.APP_CONFIG;
var app=express();

var initCtx=function(){
    logger.info('init app...');
    var cfg=AppConfig.SERVER;
    _.each(cfg.EXPRESS_SETTINGS,function(v,k){app.set(k,v)})
    if(cfg.USE_MY_SQL) {
        logger.info("link mysql database...");
        AppCtx.KNEX=require('knex')(AppConfig.KNEX);
    }else{
        logger.warn("not link mysql database...");
    }
};

var findFiles=function(dir){
    var files=[];
    var find=function(dir,files){
        var items = fs.readdirSync(dir);
        _.each(items,function(item){
            var p=path.join(dir,item);
            if(_.endsWith(item,'.js'))return files.push(p);
            var stats = fs.statSync(p);
            if(stats.isDirectory())return find(p,files);
        });
        return files;
    };
    return find(dir,files);
};

var addServices=function(files){
    var S=AppConfig.SERVER.SERVICE;
    var home=path.join(S.dir,S.home);
    _.each(files,function(file){
        if(file==home){
            app.use('/',require(home));
            logger.debug('register home service：%s',S.home);
        }else{
            var url=S.url+file.replace(S.dir,'').replace(/\\|\//g,'/').replace('.js','');
            app.use(url,require(file));
            logger.debug('register service：%s',url);
        }
    });
};

var addFilters=function(type){
    var dir=AppConfig.SERVER.FILTER.dir;
    var configs=AppConfig.SERVER.FILTER[type];

    _.each(configs,function(config){
        if(config.disabled)return;
        var filter=require(path.join(dir,config.file));
        var fn=config.fn&& _.isFunction(filter[config.fn])?filter[config.fn]:filter;
        var url=config.url?config.url:'/';

        app.use(url,fn);
        logger.debug('注册自定义中间件(%s): %j"',type,config);
    })
}

var initMiddleware=Promise.method(function () {
    logger.info('register middleware...');

    addFilters('head');
    app.use(express.static('public'));
    var bodyParser=require('body-parser');
    var BP=AppConfig.BODY_PARSER;
    app.use(bodyParser.json(BP.json));
    app.use(bodyParser.urlencoded(BP.urlencoded));
    app.use(require('multer')(BP.multer));
    app.use(function (req,res,next) {//设置跨域
        res.setHeader("Access-Control-Allow-Origin","*");
        next();
    });
    addFilters('middle');
    addServices(findFiles(AppConfig.SERVER.SERVICE.dir));
    addFilters('end');
});

var server;
var startServer=Promise.method(function(){
    logger.info('start server...');
    var config=AppConfig.SERVER;
    server=app.listen(config.LISTEN_PORT, function () {
        var _address=server.address();
        logger.info('listen port:%d',_address.port);
    });
});

var stopServer=function(){
    if(server){
        logger.info('server stop...');
        server.close(exitProcess);
    }

    setTimeout(exitProcess,AppConfig.SERVER.STOP_TIMEOUT);
    function exitProcess(){
        logger.info('server process exit，process id:"%d"',process.pid);
        process.exit(1);
    }
};

var errorHandler= function (e) {
    logger.error(e,'server error...');
    stopServer();
};

Promise.resolve(initCtx()).
    then(initMiddleware).
    then(startServer).
    catch(errorHandler);
