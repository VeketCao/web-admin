/**
 * Created by Veket on 2016/10/24.
 */
var s=module.exports=global.AppCtx={};
var path=require('path');

s.APP_ROOT_DIR=__dirname;
s.APP_CONFIG_FILE_PATH='./serve/config/app-config.js';
s.APP_CONFIG=require(s.APP_CONFIG_FILE_PATH);

s.require=function (p) {
    return require(path.join(s.APP_ROOT_DIR,p));
};

s.Logger=require('./serve/common/logger.js')(s.APP_CONFIG.LOGGERS);