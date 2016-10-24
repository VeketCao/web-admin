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

var initMiddleware=Promise.method(function () {
    logger.info('register middleware...');
    app.use(express.static('public'));

    var bodyParser=require('body-parser');
    var BP=AppConfig.BODY_PARSER;
    app.use(bodyParser.json(BP.json));
    app.use(bodyParser.urlencoded(BP.urlencoded));
    app.use(require('multer')(BP.multer));

    addServices(findFiles(AppConfig.SERVER.SERVICE.dir));
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

Promise.resolve(initCtx()).
    then(initMiddleware).
    then(startServer).
    catch();